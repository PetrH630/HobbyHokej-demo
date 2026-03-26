package cz.phsoft.hokej.notifications.services;

import cz.phsoft.hokej.notifications.dto.SpecialNotificationRequestDTO;
import cz.phsoft.hokej.notifications.dto.SpecialNotificationTargetDTO;
import cz.phsoft.hokej.notifications.email.EmailMessageBuilder;
import cz.phsoft.hokej.notifications.entities.NotificationDeliveryEntity;
import cz.phsoft.hokej.notifications.enums.NotificationType;
import cz.phsoft.hokej.notifications.events.NotificationDeliveryCreatedEvent;
import cz.phsoft.hokej.notifications.messaging.dto.EmailNotificationMessage;
import cz.phsoft.hokej.notifications.messaging.dto.SmsNotificationMessage;
import cz.phsoft.hokej.notifications.sms.SmsMessageBuilder;
import cz.phsoft.hokej.player.entities.PlayerEntity;
import cz.phsoft.hokej.player.entities.PlayerSettingsEntity;
import cz.phsoft.hokej.player.exceptions.PlayerNotFoundException;
import cz.phsoft.hokej.player.repositories.PlayerRepository;
import cz.phsoft.hokej.player.repositories.PlayerSettingsRepository;
import cz.phsoft.hokej.user.entities.AppUserEntity;
import cz.phsoft.hokej.user.exceptions.UserNotFoundException;
import cz.phsoft.hokej.user.repositories.AppUserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

/**
 * Implementace služby pro odesílání speciálních zpráv administrátorem.
 *
 * Odpovědnost třídy spočívá v orkestraci více komunikačních kanálů
 * pro speciální administrátorské zprávy. Pro definované příjemce
 * se vytvářejí in-app notifikace a podle požadavku se zakládají
 * delivery joby pro e-mail a SMS, které se následně zpracují přes RabbitMQ.
 *
 * Všechny akce se provádějí bez ohledu na uživatelská notifikační
 * nastavení, protože speciální zprávy představují nadřazenou,
 * administrativní nebo systémovou komunikaci.
 *
 * V DEMO režimu se e-maily a SMS fyzicky neodesílají. Informace o DEMO režimu
 * se přenáší v delivery zprávě a consumer je následně uloží do DemoNotificationStore.
 */
@Service
public class SpecialNotificationServiceImpl implements SpecialNotificationService {

    private static final Logger log = LoggerFactory.getLogger(SpecialNotificationServiceImpl.class);

    private final AppUserRepository appUserRepository;
    private final PlayerRepository playerRepository;
    private final PlayerSettingsRepository playerSettingsRepository;
    private final InAppNotificationService inAppNotificationService;
    private final EmailMessageBuilder emailMessageBuilder;
    private final SmsMessageBuilder smsMessageBuilder;
    private final NotificationDeliveryService notificationDeliveryService;
    private final ApplicationEventPublisher applicationEventPublisher;
    private final DemoModeService demoModeService;

    /**
     * Vytváří instanci služby pro speciální notifikace.
     *
     * @param appUserRepository repository pro práci s entitami uživatelů
     * @param playerRepository repository pro práci s entitami hráčů
     * @param playerSettingsRepository repository pro nastavení hráčů
     * @param inAppNotificationService služba pro ukládání in-app notifikací
     * @param emailMessageBuilder builder pro sestavení obsahu e-mailů
     * @param smsMessageBuilder builder pro sestavení textu SMS zpráv
     * @param notificationDeliveryService služba pro vytvoření pending delivery záznamů
     * @param applicationEventPublisher publisher pro vyvolání delivery eventů
     * @param demoModeService služba určující, zda je aplikace v DEMO režimu
     */
    public SpecialNotificationServiceImpl(AppUserRepository appUserRepository,
                                          PlayerRepository playerRepository,
                                          PlayerSettingsRepository playerSettingsRepository,
                                          InAppNotificationService inAppNotificationService,
                                          EmailMessageBuilder emailMessageBuilder,
                                          SmsMessageBuilder smsMessageBuilder,
                                          NotificationDeliveryService notificationDeliveryService,
                                          ApplicationEventPublisher applicationEventPublisher,
                                          DemoModeService demoModeService) {
        this.appUserRepository = appUserRepository;
        this.playerRepository = playerRepository;
        this.playerSettingsRepository = playerSettingsRepository;
        this.inAppNotificationService = inAppNotificationService;
        this.emailMessageBuilder = emailMessageBuilder;
        this.smsMessageBuilder = smsMessageBuilder;
        this.notificationDeliveryService = notificationDeliveryService;
        this.applicationEventPublisher = applicationEventPublisher;
        this.demoModeService = demoModeService;
    }

    /**
     * Odesílá speciální zprávu všem definovaným příjemcům.
     *
     * Pro každý cíl definovaný ve vstupním DTO se provádí:
     * vytvoření in-app notifikace typu SPECIAL_MESSAGE a podle
     * nastavení také vytvoření delivery jobu pro e-mail a SMS zprávu.
     *
     * E-mail i SMS jsou získávány z preferencí uživatele a případných
     * nastavení hráče, přičemž se ignorují běžná uživatelská notifikační nastavení.
     *
     * Selhání jednoho cíle neblokuje zpracování ostatních cílů.
     *
     * @param request definice zprávy a seznam cílů pro speciální notifikaci
     * @throws NullPointerException pokud je request null
     * @throws UserNotFoundException pokud některý z cílových uživatelů neexistuje
     * @throws PlayerNotFoundException pokud některý z cílových hráčů neexistuje
     */
    @Override
    @Transactional
    public void sendSpecialNotification(SpecialNotificationRequestDTO request) {
        Objects.requireNonNull(request, "request must not be null");

        if (request.getTargets() == null || request.getTargets().isEmpty()) {
            log.debug("SpecialNotificationService.sendSpecialNotification: prázdný seznam příjemců, nic se neprovádí");
            return;
        }

        request.getTargets().forEach(target -> {
            AppUserEntity user = appUserRepository.findById(target.getUserId())
                    .orElseThrow(() -> new UserNotFoundException(target.getUserId()));

            PlayerEntity player = null;
            PlayerSettingsEntity playerSettings = null;

            if (target.getPlayerId() != null) {
                player = playerRepository.findById(target.getPlayerId())
                        .orElseThrow(() -> new PlayerNotFoundException(target.getPlayerId()));

                playerSettings = playerSettingsRepository.findByPlayer(player)
                        .orElse(null);
            }

            String emailTo = null;
            String smsTo = null;

            if (request.isSendEmail()) {
                emailTo = resolveEmail(user, playerSettings);
                if (hasText(emailTo)) {
                    enqueueSpecialEmail(emailTo.trim(), user, player, request);
                } else {
                    log.debug(
                            "SpecialNotificationService.sendSpecialNotification: není k dispozici email pro playerId={} (userId={})",
                            player != null ? player.getId() : null,
                            user.getId()
                    );
                    emailTo = null;
                }
            }

            if (request.isSendSms() && playerSettings != null) {
                smsTo = resolvePhoneNumber(playerSettings);
                if (hasText(smsTo)) {
                    enqueueSpecialSms(smsTo.trim(), user, player, request);
                } else {
                    log.debug(
                            "SpecialNotificationService.sendSpecialNotification: chybí telefonní číslo pro playerId={} (userId={})",
                            player != null ? player.getId() : null,
                            user.getId()
                    );
                    smsTo = null;
                }
            }

            inAppNotificationService.storeSpecialMessage(
                    user,
                    player,
                    request.getTitle(),
                    request.getMessage(),
                    emailTo,
                    smsTo
            );
        });
    }

    @Override
    public List<SpecialNotificationTargetDTO> getSpecialNotificationTargets() {

        List<SpecialNotificationTargetDTO> result = new ArrayList<>();

        List<PlayerEntity> allPlayers = playerRepository.findAll();

        for (PlayerEntity player : allPlayers) {

            AppUserEntity user = player.getUser();
            if (user == null || !user.isEnabled()) {
                continue;
            }

            String userName = buildUserFullName(user);
            String displayName = player.getFullName() + " (" + userName + ", " + user.getEmail() + ")";

            SpecialNotificationTargetDTO dto = new SpecialNotificationTargetDTO();
            dto.setUserId(user.getId());
            dto.setPlayerId(player.getId());
            dto.setDisplayName(displayName);
            dto.setType("PLAYER");

            result.add(dto);
        }

        List<AppUserEntity> allUsers = appUserRepository.findAll();

        allUsers.stream()
                .filter(AppUserEntity::isEnabled)
                .filter(user -> user.getPlayers() == null || user.getPlayers().isEmpty())
                .forEach(user -> {
                    String userName = buildUserFullName(user);
                    String displayName = userName + " (" + user.getEmail() + ")";

                    SpecialNotificationTargetDTO dto = new SpecialNotificationTargetDTO();
                    dto.setUserId(user.getId());
                    dto.setPlayerId(null);
                    dto.setDisplayName(displayName);
                    dto.setType("USER");

                    result.add(dto);
                });

        result.sort(Comparator.comparing(
                SpecialNotificationTargetDTO::getDisplayName,
                String.CASE_INSENSITIVE_ORDER
        ));

        log.debug("SpecialNotificationService.getSpecialNotificationTargets: vráceno {} cílů", result.size());

        return result;
    }

    /**
     * Vytvoří pending delivery pro speciální e-mail a vyvolá aplikační event,
     * který bude po commitu publikován do RabbitMQ.
     *
     * @param to cílová e-mailová adresa
     * @param user uživatel, kterému je zpráva určena
     * @param player hráč, pokud je zpráva vázána na konkrétního hráče; může být null
     * @param request definice speciální zprávy včetně titulku a textu
     */
    private void enqueueSpecialEmail(String to,
                                     AppUserEntity user,
                                     PlayerEntity player,
                                     SpecialNotificationRequestDTO request) {

        if (!hasText(to)) {
            return;
        }

        EmailMessageBuilder.EmailContent content =
                emailMessageBuilder.buildSpecialMessage(
                        user,
                        player,
                        request.getTitle(),
                        request.getMessage()
                );

        if (content == null) {
            log.debug("SpecialNotificationService.enqueueSpecialEmail: EmailContent je null, nic se neodesílá");
            return;
        }

        String messageId = UUID.randomUUID().toString();
        Long userId = user != null ? user.getId() : null;
        Long playerId = player != null ? player.getId() : null;
        boolean demoMode = demoModeService.isDemoMode();

        NotificationDeliveryEntity entity = notificationDeliveryService.createPendingEmail(
                messageId,
                NotificationType.SPECIAL_MESSAGE,
                userId,
                playerId,
                null,
                null,
                to,
                content.subject(),
                shorten(content.body(), 1000),
                demoMode
        );

        log.debug("SpecialNotificationService.enqueueSpecialEmail: vytvořen PENDING email delivery id={} messageId={} to={}",
                entity.getId(), messageId, to);

        EmailNotificationMessage message = new EmailNotificationMessage(
                messageId,
                NotificationType.SPECIAL_MESSAGE,
                userId,
                playerId,
                null,
                null,
                to,
                content.subject(),
                content.body(),
                content.html(),
                demoMode,
                player != null ? "PLAYER" : "USER",
                LocalDateTime.now()
        );

        applicationEventPublisher.publishEvent(NotificationDeliveryCreatedEvent.forEmail(message));
    }

    /**
     * Vytvoří pending delivery pro speciální SMS a vyvolá aplikační event,
     * který bude po commitu publikován do RabbitMQ.
     *
     * @param phoneNumber cílové telefonní číslo
     * @param user uživatel, kterému je zpráva určena
     * @param player hráč, kterého se zpráva týká; může být null
     * @param request definice speciální zprávy včetně titulku a textu
     */
    private void enqueueSpecialSms(String phoneNumber,
                                   AppUserEntity user,
                                   PlayerEntity player,
                                   SpecialNotificationRequestDTO request) {
        if (!hasText(phoneNumber)) {
            return;
        }

        String text = smsMessageBuilder.buildSpecialMessage(
                request.getTitle(),
                request.getMessage(),
                player
        );

        if (!hasText(text)) {
            log.debug("SpecialNotificationService.enqueueSpecialSms: prázdný text SMS, nic se neodesílá");
            return;
        }

        String messageId = UUID.randomUUID().toString();
        Long userId = user != null ? user.getId() : null;
        Long playerId = player != null ? player.getId() : null;
        boolean demoMode = demoModeService.isDemoMode();

        NotificationDeliveryEntity entity = notificationDeliveryService.createPendingSms(
                messageId,
                NotificationType.SPECIAL_MESSAGE,
                userId,
                playerId,
                null,
                null,
                phoneNumber,
                shorten(text, 1000),
                demoMode
        );

        log.debug("SpecialNotificationService.enqueueSpecialSms: vytvořen PENDING sms delivery id={} messageId={} phone={}",
                entity.getId(), messageId, phoneNumber);

        SmsNotificationMessage message = new SmsNotificationMessage(
                messageId,
                NotificationType.SPECIAL_MESSAGE,
                userId,
                playerId,
                null,
                null,
                phoneNumber,
                text,
                demoMode,
                LocalDateTime.now()
        );

        applicationEventPublisher.publishEvent(NotificationDeliveryCreatedEvent.forSms(message));
    }

    private String resolvePhoneNumber(PlayerSettingsEntity playerSettings) {
        if (playerSettings == null) {
            return null;
        }

        String phone = playerSettings.getContactPhone();
        if (phone != null && !phone.isBlank()) {
            return phone;
        }
        return null;
    }

    private String resolveEmail(AppUserEntity user, PlayerSettingsEntity playerSettings) {
        String userEmail = (user != null && user.getEmail() != null && !user.getEmail().isBlank())
                ? user.getEmail()
                : null;

        String playerEmail = (playerSettings != null
                && playerSettings.getContactEmail() != null
                && !playerSettings.getContactEmail().isBlank())
                ? playerSettings.getContactEmail()
                : null;

        if (playerEmail == null) {
            return userEmail;
        }

        if (userEmail != null && userEmail.equalsIgnoreCase(playerEmail)) {
            return userEmail;
        }

        return playerEmail;
    }

    private String buildUserFullName(AppUserEntity user) {
        String name = user.getName() != null ? user.getName() : "";
        String surname = user.getSurname() != null ? user.getSurname() : "";
        String fullName = (name + " " + surname).trim();
        return fullName.isEmpty() ? user.getEmail() : fullName;
    }

    private boolean hasText(String text) {
        return text != null && !text.isBlank();
    }

    private String shorten(String text, int maxLength) {
        if (text == null) {
            return null;
        }
        return text.length() <= maxLength ? text : text.substring(0, maxLength);
    }
}