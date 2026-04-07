package cz.phsoft.hokej.notifications.services;

import cz.phsoft.hokej.match.entities.MatchEntity;
import cz.phsoft.hokej.match.enums.MatchMode;
import cz.phsoft.hokej.match.enums.MatchStatus;
import cz.phsoft.hokej.match.repositories.MatchRepository;
import cz.phsoft.hokej.notifications.enums.NotificationType;
import cz.phsoft.hokej.player.entities.PlayerEntity;
import cz.phsoft.hokej.player.enums.PlayerPosition;
import cz.phsoft.hokej.player.enums.PlayerStatus;
import cz.phsoft.hokej.player.enums.PlayerType;
import cz.phsoft.hokej.player.repositories.PlayerRepository;
import cz.phsoft.hokej.registration.entities.MatchRegistrationEntity;
import cz.phsoft.hokej.registration.enums.PlayerMatchStatus;
import cz.phsoft.hokej.registration.repositories.MatchRegistrationRepository;
import cz.phsoft.hokej.season.entities.SeasonEntity;
import cz.phsoft.hokej.season.repositories.SeasonRepository;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.context.ActiveProfiles;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.NONE,
        properties = {
                "spring.flyway.enabled=false",
                "app.seed.enabled=false",
                "app.notifications.no-response.days-before=3",
                "sms.enabled=false",
                "email.enabled=false",

                "textbee.api-url=http://localhost/fake",
                "textbee.api-key=test-key",
                "spring.mail.from=test@localhost",
                "app.base-url=http://localhost:8080",
                "app.frontend-base-url=http://localhost:5173"
        }
)
@ActiveProfiles("test")
class NoResponseReminderSchedulerSpringBootTest {

    private static final ZoneId ZONE_ID = ZoneId.of("Europe/Prague");
    private static final LocalDateTime FIXED_NOW = LocalDateTime.of(2026, 3, 10, 18, 0);

    @Autowired
    private MatchRepository matchRepository;

    @Autowired
    private MatchRegistrationRepository matchRegistrationRepository;

    @Autowired
    private SeasonRepository seasonRepository;

    @Autowired
    private PlayerRepository playerRepository;

    @Autowired
    private NoResponseReminderScheduler noResponseReminderScheduler;

    @MockBean
    private NotificationService notificationService;

    @BeforeEach
    void cleanDatabase() {
        matchRegistrationRepository.deleteAll();
        matchRepository.deleteAll();
        playerRepository.deleteAll();
        seasonRepository.deleteAll();
        reset(notificationService);
    }

    @Test
    void shouldNotifyPlayerWithoutResponse() {
        SeasonEntity season = persistSeason();
        MatchEntity match = persistMatch(season, FIXED_NOW.plusDays(3));

        PlayerEntity noResponsePlayer = persistPlayer("Petr", "BezReakce");
        PlayerEntity registeredPlayer = persistPlayer("Jan", "Registrovany");

        MatchRegistrationEntity registration = new MatchRegistrationEntity();
        registration.setMatch(match);
        registration.setPlayer(registeredPlayer);
        registration.setStatus(PlayerMatchStatus.REGISTERED);
        registration.setCreatedBy("test");
        registration.setTimestamp(FIXED_NOW.minusDays(1));
        matchRegistrationRepository.save(registration);


        noResponseReminderScheduler.processNoResponseReminders();


        verify(notificationService, times(1))
                .notifyPlayer(
                        argThat((PlayerEntity player) ->
                                player != null && player.getId().equals(noResponsePlayer.getId())),
                        eq(NotificationType.MATCH_REGISTRATION_NO_RESPONSE),
                        argThat((MatchEntity savedMatch) ->
                                savedMatch != null && savedMatch.getId().equals(match.getId()))
                );

        verify(notificationService, never())
                .notifyPlayer(
                        argThat((PlayerEntity player) ->
                                player != null && player.getId().equals(registeredPlayer.getId())),
                        eq(NotificationType.MATCH_REGISTRATION_NO_RESPONSE),
                        any(MatchEntity.class)
                );
    }

    @Test
    void shouldNotNotifyWhenEveryoneAlreadyResponded() {
        SeasonEntity season = persistSeason();
        MatchEntity match = persistMatch(season, FIXED_NOW.plusDays(3));

        PlayerEntity registeredPlayer = persistPlayer("Jan", "Registrovany");

        MatchRegistrationEntity registration = new MatchRegistrationEntity();
        registration.setMatch(match);
        registration.setPlayer(registeredPlayer);
        registration.setStatus(PlayerMatchStatus.REGISTERED);
        registration.setCreatedBy("test");
        registration.setTimestamp(FIXED_NOW.minusDays(1));
        matchRegistrationRepository.save(registration);

        noResponseReminderScheduler.processNoResponseReminders();

        verify(notificationService, never())
                .notifyPlayer(any(PlayerEntity.class), eq(NotificationType.MATCH_REGISTRATION_NO_RESPONSE), eq(match));
    }

    @Test
    void shouldNotNotifyWhenMatchIsOutsideConfiguredWindow() {
        SeasonEntity season = persistSeason();
        persistMatch(season, FIXED_NOW.plusDays(2));

        persistPlayer("Petr", "BezReakce");

        noResponseReminderScheduler.processNoResponseReminders();

        verifyNoInteractions(notificationService);
    }

    private SeasonEntity persistSeason() {
        SeasonEntity season = new SeasonEntity();
        season.setName("2025/2026");
        season.setStartDate(LocalDate.of(2025, 9, 1));
        season.setEndDate(LocalDate.of(2026, 5, 31));
        season.setActive(true);
        return seasonRepository.save(season);
    }

    private MatchEntity persistMatch(SeasonEntity season, LocalDateTime dateTime) {
        MatchEntity match = new MatchEntity();
        match.setSeason(season);
        match.setDateTime(dateTime);
        match.setLocation("Ostrava");
        match.setDescription("No response reminder test");
        match.setMaxPlayers(20);
        match.setPrice(200);
        match.setMatchMode(MatchMode.FIVE_ON_FIVE_WITH_GOALIE);
        match.setMatchStatus(MatchStatus.UPDATED);
        return matchRepository.save(match);
    }

    private PlayerEntity persistPlayer(String name, String surname) {
        PlayerEntity player = new PlayerEntity();
        player.setName(name);
        player.setSurname(surname);
        player.setType(PlayerType.STANDARD);
        player.setPhoneNumber("+420777123123");
        player.setPrimaryPosition(PlayerPosition.CENTER);
        player.setPlayerStatus(PlayerStatus.APPROVED);
        return playerRepository.save(player);
    }

    @TestConfiguration
    static class FixedClockConfig {

        @Bean
        @Primary
        Clock testClock() {
            return Clock.fixed(FIXED_NOW.atZone(ZONE_ID).toInstant(), ZONE_ID);
        }

        @Bean
        @Primary
        HttpSession httpSession() {
            return Mockito.mock(HttpSession.class);
        }

        @Bean
        @Primary
        JavaMailSender javaMailSender() {
            return Mockito.mock(JavaMailSender.class);
        }
    }
}