package cz.phsoft.hokej.user.services;

import cz.phsoft.hokej.demo.DemoModeGuard;
import cz.phsoft.hokej.notifications.enums.NotificationType;
import cz.phsoft.hokej.notifications.services.ForgottenPasswordResetContext;
import cz.phsoft.hokej.notifications.services.NotificationService;
import cz.phsoft.hokej.notifications.services.UserActivationContext;
import cz.phsoft.hokej.notifications.email.EmailService;
import cz.phsoft.hokej.user.dto.ForgottenPasswordResetDTO;
import cz.phsoft.hokej.user.dto.RegisterUserDTO;
import cz.phsoft.hokej.user.entities.AppUserEntity;
import cz.phsoft.hokej.user.entities.EmailVerificationTokenEntity;
import cz.phsoft.hokej.user.entities.ForgottenPasswordResetTokenEntity;
import cz.phsoft.hokej.user.enums.Role;
import cz.phsoft.hokej.user.exceptions.InvalidResetTokenException;
import cz.phsoft.hokej.user.exceptions.UserAlreadyExistsException;
import cz.phsoft.hokej.user.mappers.AppUserMapper;
import cz.phsoft.hokej.user.repositories.AppUserRepository;
import cz.phsoft.hokej.user.repositories.EmailVerificationTokenRepository;
import cz.phsoft.hokej.user.repositories.ForgottenPasswordResetTokenRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit testy pro AppUserServiceImpl.
 *
 * Testuje se:
 * - registrace nového uživatele,
 * - kontrola duplicitního e-mailu,
 * - aktivace uživatele přes ověřovací token,
 * - reset zapomenutého hesla.
 */
@ExtendWith(MockitoExtension.class)
class AppUserServiceImplTest {

    @Mock
    private AppUserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AppUserMapper appUserMapper;

    @Mock
    private EmailService emailService;

    @Mock
    private EmailVerificationTokenRepository tokenRepository;

    @Mock
    private AppUserSettingsService appUserSettingsService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private ForgottenPasswordResetTokenRepository forgottenPasswordResetTokenRepository;

    @Mock
    private DemoModeGuard demoModeGuard;

    @Mock
    private Clock clock;

    @InjectMocks
    private AppUserServiceImpl appUserService;

    /**
     * Testuje úspěšnou registraci nového uživatele.
     *
     * Ověřuje se, že:
     * - se zkontroluje e-mail a hesla,
     * - vytvoří se neaktivní účet,
     * - heslo se zakóduje,
     * - vytvoří se verifikační token,
     * - odešle se notifikace s aktivačním odkazem.
     */
    @Test
    void register_shouldCreateDisabledUserSaveVerificationTokenAndSendActivationNotification() {
        ReflectionTestUtils.setField(appUserService, "frontendBaseUrl", "https://frontend.phsoft.cz");

        RegisterUserDTO dto = new RegisterUserDTO();
        dto.setName("Petr");
        dto.setSurname("Hlista");
        dto.setEmail("petr@example.com");
        dto.setPassword("Secret123");
        dto.setPasswordConfirm("Secret123");

        AppUserEntity mappedUser = new AppUserEntity();
        mappedUser.setName("Petr");
        mappedUser.setSurname("Hlista");
        mappedUser.setEmail("petr@example.com");

        AppUserEntity savedUser = new AppUserEntity();
        savedUser.setId(1L);
        savedUser.setName("Petr");
        savedUser.setSurname("HLISTA");
        savedUser.setEmail("petr@example.com");
        savedUser.setPassword("encoded-password");
        savedUser.setRole(Role.ROLE_PLAYER);
        savedUser.setEnabled(false);

        when(userRepository.findByEmail("petr@example.com")).thenReturn(Optional.empty());
        when(appUserMapper.fromRegisterDto(dto)).thenReturn(mappedUser);
        when(passwordEncoder.encode("Secret123")).thenReturn("encoded-password");
        when(userRepository.save(mappedUser)).thenReturn(savedUser);

        ArgumentCaptor<EmailVerificationTokenEntity> tokenCaptor =
                ArgumentCaptor.forClass(EmailVerificationTokenEntity.class);

        when(tokenRepository.save(tokenCaptor.capture()))
                .thenAnswer(invocation -> invocation.getArgument(0));

        ArgumentCaptor<Object> notificationContextCaptor =
                ArgumentCaptor.forClass(Object.class);

        appUserService.register(dto);

        // Ověření základního průběhu registrace
        verify(userRepository).findByEmail("petr@example.com");
        verify(appUserMapper).fromRegisterDto(dto);
        verify(passwordEncoder).encode("Secret123");
        verify(userRepository).save(mappedUser);
        verify(tokenRepository).save(any(EmailVerificationTokenEntity.class));

        // Ověření nastavení nového uživatele
        assertEquals("encoded-password", mappedUser.getPassword());
        assertEquals(Role.ROLE_PLAYER, mappedUser.getRole());
        assertFalse(mappedUser.isEnabled());

        // Ověření vytvořeného tokenu
        EmailVerificationTokenEntity savedToken = tokenCaptor.getValue();
        assertNotNull(savedToken);
        assertNotNull(savedToken.getToken());
        assertEquals(savedUser, savedToken.getUser());
        assertNotNull(savedToken.getExpiresAt());

        // Ověření odeslané notifikace s aktivačním odkazem
        verify(notificationService).notifyUser(
                eq(savedUser),
                eq(NotificationType.USER_CREATED),
                notificationContextCaptor.capture()
        );

        assertInstanceOf(UserActivationContext.class, notificationContextCaptor.getValue());
        UserActivationContext context = (UserActivationContext) notificationContextCaptor.getValue();

        assertEquals(savedUser, context.user());
        assertTrue(context.activationLink().startsWith("https://frontend.phsoft.cz/verify?token="));
        assertTrue(context.activationLink().contains(savedToken.getToken()));
    }

    /**
     * Testuje registraci s již existujícím e-mailem.
     *
     * Ověřuje se, že:
     * - je vyhozena výjimka,
     * - nevytváří se nový účet,
     * - neukládá se token,
     * - neposílá se notifikace.
     */
    @Test
    void register_shouldThrowUserAlreadyExistsException_whenEmailAlreadyExists() {
        RegisterUserDTO dto = new RegisterUserDTO();
        dto.setName("Petr");
        dto.setSurname("Hlista");
        dto.setEmail("petr@example.com");
        dto.setPassword("Secret123");
        dto.setPasswordConfirm("Secret123");

        AppUserEntity existingUser = new AppUserEntity();
        existingUser.setId(99L);
        existingUser.setEmail("petr@example.com");

        when(userRepository.findByEmail("petr@example.com")).thenReturn(Optional.of(existingUser));

        assertThrows(UserAlreadyExistsException.class, () -> appUserService.register(dto));

        verify(userRepository).findByEmail("petr@example.com");
        verify(appUserMapper, never()).fromRegisterDto(any());
        verify(passwordEncoder, never()).encode(any());
        verify(userRepository, never()).save(any(AppUserEntity.class));
        verify(tokenRepository, never()).save(any(EmailVerificationTokenEntity.class));
        verify(notificationService, never()).notifyUser(any(), any(), any());
    }

    /**
     * Testuje úspěšnou aktivaci účtu přes platný token.
     *
     * Ověřuje se, že:
     * - se token najde,
     * - účet se aktivuje,
     * - vytvoří se výchozí nastavení, pokud chybí,
     * - účet se uloží,
     * - token se smaže,
     * - odešle se notifikace o aktivaci.
     */
    @Test
    void activateUser_shouldEnableUserCreateDefaultSettingsDeleteTokenAndNotify_whenTokenIsValid() {
        String tokenValue = "valid-token";

        AppUserEntity user = new AppUserEntity();
        user.setId(1L);
        user.setName("Petr");
        user.setSurname("HLISTA");
        user.setEmail("petr@example.com");
        user.setEnabled(false);
        user.setSettings(null);

        EmailVerificationTokenEntity verificationToken = new EmailVerificationTokenEntity();
        verificationToken.setToken(tokenValue);
        verificationToken.setUser(user);
        verificationToken.setExpiresAt(LocalDateTime.now().plusHours(2));

        when(tokenRepository.findByToken(tokenValue)).thenReturn(Optional.of(verificationToken));
        when(userRepository.save(user)).thenReturn(user);

        boolean result = appUserService.activateUser(tokenValue);

        assertTrue(result);
        assertTrue(user.isEnabled());

        verify(tokenRepository).findByToken(tokenValue);
        verify(appUserSettingsService).createDefaultSettingsForUser(user);
        verify(userRepository).save(user);
        verify(tokenRepository).delete(verificationToken);
        verify(notificationService).notifyUser(user, NotificationType.USER_ACTIVATED, null);
    }

    /**
     * Testuje expirovaný aktivační token.
     *
     * Ověřuje se, že:
     * - metoda vrátí false,
     * - účet se neaktivuje,
     * - nic se neukládá,
     * - token se nemaže,
     * - neposílá se notifikace.
     */
    @Test
    void activateUser_shouldReturnFalse_whenTokenIsExpired() {
        String tokenValue = "expired-token";

        AppUserEntity user = new AppUserEntity();
        user.setId(1L);
        user.setEmail("petr@example.com");
        user.setEnabled(false);

        EmailVerificationTokenEntity expiredToken = new EmailVerificationTokenEntity();
        expiredToken.setToken(tokenValue);
        expiredToken.setUser(user);
        expiredToken.setExpiresAt(LocalDateTime.now().minusMinutes(1));

        when(tokenRepository.findByToken(tokenValue)).thenReturn(Optional.of(expiredToken));

        boolean result = appUserService.activateUser(tokenValue);

        assertFalse(result);
        assertFalse(user.isEnabled());

        verify(tokenRepository).findByToken(tokenValue);
        verify(appUserSettingsService, never()).createDefaultSettingsForUser(any());
        verify(userRepository, never()).save(any());
        verify(tokenRepository, never()).delete(any());
        verify(notificationService, never()).notifyUser(any(), any(), any());
    }

    /**
     * Testuje požadavek na reset zapomenutého hesla.
     *
     * Ověřuje se, že:
     * - se najde uživatel podle e-mailu,
     * - smažou se staré reset tokeny,
     * - vytvoří se nový reset token,
     * - odešle se notifikace s reset odkazem.
     */
    @Test
    void requestForgottenPasswordReset_shouldCreateResetTokenAndSendNotification_whenUserExists() {
        ReflectionTestUtils.setField(appUserService, "baseUrl", "https://backend.phsoft.cz");

        String email = "petr@example.com";

        AppUserEntity user = new AppUserEntity();
        user.setId(1L);
        user.setEmail(email);
        user.setName("Petr");
        user.setSurname("HLISTA");

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));

        ArgumentCaptor<ForgottenPasswordResetTokenEntity> tokenCaptor =
                ArgumentCaptor.forClass(ForgottenPasswordResetTokenEntity.class);

        when(forgottenPasswordResetTokenRepository.save(tokenCaptor.capture()))
                .thenAnswer(invocation -> invocation.getArgument(0));

        ArgumentCaptor<Object> notificationContextCaptor =
                ArgumentCaptor.forClass(Object.class);

        appUserService.requestForgottenPasswordReset(email);

        verify(userRepository).findByEmail(email);
        verify(forgottenPasswordResetTokenRepository).deleteByUser(user);
        verify(forgottenPasswordResetTokenRepository).save(any(ForgottenPasswordResetTokenEntity.class));

        verify(notificationService).notifyUser(
                eq(user),
                eq(NotificationType.FORGOTTEN_PASSWORD_RESET_REQUEST),
                notificationContextCaptor.capture()
        );

        ForgottenPasswordResetTokenEntity savedToken = tokenCaptor.getValue();
        assertNotNull(savedToken);
        assertEquals(user, savedToken.getUser());
        assertNotNull(savedToken.getToken());
        assertNotNull(savedToken.getExpiresAt());

        assertInstanceOf(ForgottenPasswordResetContext.class, notificationContextCaptor.getValue());
        ForgottenPasswordResetContext context =
                (ForgottenPasswordResetContext) notificationContextCaptor.getValue();

        assertEquals(user, context.user());
        assertTrue(context.resetLink().startsWith("https://backend.phsoft.cz/api/auth/reset-password?token="));
        assertTrue(context.resetLink().contains(savedToken.getToken()));
    }

    /**
     * Testuje reset zapomenutého hesla přes platný token.
     *
     * Ověřuje se, že:
     * - se ověří token,
     * - zakóduje se nové heslo,
     * - uživatel se uloží,
     * - reset token se smaže,
     * - odešle se notifikace o dokončení resetu.
     */
    @Test
    void forgottenPasswordReset_shouldUpdatePasswordDeleteTokenAndNotify_whenTokenIsValid() {
        ForgottenPasswordResetDTO dto = new ForgottenPasswordResetDTO();
        dto.setToken("reset-token");
        dto.setNewPassword("NewSecret123");
        dto.setNewPasswordConfirm("NewSecret123");

        AppUserEntity user = new AppUserEntity();
        user.setId(1L);
        user.setEmail("petr@example.com");
        user.setPassword("old-password");

        ForgottenPasswordResetTokenEntity resetToken = new ForgottenPasswordResetTokenEntity();
        resetToken.setToken("reset-token");
        resetToken.setUser(user);
        resetToken.setExpiresAt(LocalDateTime.now().plusHours(2));

        when(forgottenPasswordResetTokenRepository.findByToken("reset-token"))
                .thenReturn(Optional.of(resetToken));
        when(passwordEncoder.encode("NewSecret123")).thenReturn("encoded-new-password");

        doAnswer(invocation -> {
            Runnable realAction = invocation.getArgument(2);
            realAction.run();
            return null;
        }).when(demoModeGuard).writeWithFinalize(anyLong(), anyString(), any(Runnable.class), any(Runnable.class));

        appUserService.forgottenPasswordReset(dto);

        assertEquals("encoded-new-password", user.getPassword());

        verify(forgottenPasswordResetTokenRepository).findByToken("reset-token");
        verify(passwordEncoder).encode("NewSecret123");
        verify(userRepository).save(user);
        verify(forgottenPasswordResetTokenRepository).delete(resetToken);
        verify(notificationService).notifyUser(user, NotificationType.FORGOTTEN_PASSWORD_RESET_COMPLETED, null);
    }

    /**
     * Testuje reset zapomenutého hesla s expirovaným tokenem.
     *
     * Ověřuje se, že:
     * - je vyhozena výjimka InvalidResetTokenException,
     * - heslo se nemění,
     * - nic se neukládá,
     * - token se nemaže.
     */
    @Test
    void forgottenPasswordReset_shouldThrowInvalidResetTokenException_whenTokenIsExpired() {
        ForgottenPasswordResetDTO dto = new ForgottenPasswordResetDTO();
        dto.setToken("expired-reset-token");
        dto.setNewPassword("NewSecret123");
        dto.setNewPasswordConfirm("NewSecret123");

        AppUserEntity user = new AppUserEntity();
        user.setId(1L);
        user.setEmail("petr@example.com");

        ForgottenPasswordResetTokenEntity expiredToken = new ForgottenPasswordResetTokenEntity();
        expiredToken.setToken("expired-reset-token");
        expiredToken.setUser(user);
        expiredToken.setExpiresAt(LocalDateTime.now().minusMinutes(1));

        when(forgottenPasswordResetTokenRepository.findByToken("expired-reset-token"))
                .thenReturn(Optional.of(expiredToken));

        assertThrows(InvalidResetTokenException.class, () -> appUserService.forgottenPasswordReset(dto));

        verify(forgottenPasswordResetTokenRepository).findByToken("expired-reset-token");
        verify(passwordEncoder, never()).encode(any());
        verify(userRepository, never()).save(any());
        verify(forgottenPasswordResetTokenRepository, never()).delete(any());
        verify(notificationService, never()).notifyUser(any(), any(), any());
    }
}