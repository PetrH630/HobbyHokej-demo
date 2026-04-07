package cz.phsoft.hokej.system.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import cz.phsoft.hokej.notifications.dto.EmailDTO;
import cz.phsoft.hokej.user.dto.ForgottenPasswordResetDTO;
import cz.phsoft.hokej.user.dto.RegisterUserDTO;
import cz.phsoft.hokej.user.services.AppUserService;
import jakarta.servlet.Filter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.filter.CharacterEncodingFilter;

import java.util.Map;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Controller testy pro AuthController.
 *
 * Testuje se:
 * - registrace uživatele,
 * - aktivace účtu přes token,
 * - přesměrování na reset hesla,
 * - vytvoření požadavku na zapomenuté heslo,
 * - načtení e-mailu podle reset tokenu,
 * - dokončení resetu hesla.
 */
class AuthControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;
    private AppUserService appUserService;

    @BeforeEach
    void setUp() {
        appUserService = mock(AppUserService.class);

        AuthController authController = new AuthController(appUserService);
        ReflectionTestUtils.setField(authController, "frontendBaseUrl", "https://frontend.phsoft.cz");

        Filter utf8Filter = new CharacterEncodingFilter("UTF-8", true);

        mockMvc = MockMvcBuilders
                .standaloneSetup(authController)
                .addFilters(utf8Filter)
                .build();

        objectMapper = new ObjectMapper();
    }

    /**
     * Test registrace uživatele.
     */
    @Test
    void register_shouldReturnOkAndSuccessMessage() throws Exception {
        RegisterUserDTO dto = new RegisterUserDTO();
        dto.setName("Petr");
        dto.setSurname("Novák");
        dto.setEmail("petr@example.com");
        dto.setPassword("Secret123");
        dto.setPasswordConfirm("Secret123");

        doNothing().when(appUserService).register(any(RegisterUserDTO.class));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .characterEncoding("UTF-8")
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ok"))
                .andExpect(jsonPath("$.message")
                        .value("Registrace úspěšná. Zkontrolujte email pro aktivaci účtu."));

        verify(appUserService).register(any(RegisterUserDTO.class));
    }

    /**
     * Test úspěšné aktivace účtu.
     */
    @Test
    void verifyEmail_shouldReturnOk_whenTokenIsValid() throws Exception {
        String token = "valid-token";

        when(appUserService.activateUser(token)).thenReturn(true);

        mockMvc.perform(get("/api/auth/verify")
                        .param("token", token))
                .andExpect(status().isOk())
                .andExpect(content().contentType("text/plain;charset=UTF-8"))
                .andExpect(content().string("Účet byl úspěšně aktivován."));

        verify(appUserService).activateUser(token);
    }

    /**
     * Test neplatného nebo expirovaného tokenu.
     */
    @Test
    void verifyEmail_shouldReturnBadRequest_whenTokenIsInvalidOrExpired() throws Exception {
        String token = "expired-token";

        when(appUserService.activateUser(token)).thenReturn(false);

        mockMvc.perform(get("/api/auth/verify")
                        .param("token", token))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType("text/plain;charset=UTF-8"))
                .andExpect(content().string("Neplatný nebo expirovaný aktivační odkaz."));

        verify(appUserService).activateUser(token);
    }

    /**
     * Test redirectu na frontend při resetu hesla.
     */
    @Test
    void redirectResetPassword_shouldReturnRedirectToFrontend() throws Exception {
        String token = "reset-token";

        mockMvc.perform(get("/api/auth/reset-password")
                        .param("token", token))
                .andExpect(status().isFound())
                .andExpect(header().string("Location",
                        "https://frontend.phsoft.cz/reset-password?token=" + token));
    }

    /**
     * Test vytvoření požadavku na reset hesla.
     */
    @Test
    void requestForgottenPassword_shouldReturnOk() throws Exception {
        EmailDTO dto = new EmailDTO();
        dto.setEmail("petr@example.com");

        doNothing().when(appUserService).requestForgottenPasswordReset("petr@example.com");

        mockMvc.perform(post("/api/auth/forgotten-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .characterEncoding("UTF-8")
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(content().string(""));

        verify(appUserService).requestForgottenPasswordReset("petr@example.com");
    }

    /**
     * Test načtení e-mailu podle reset tokenu.
     */
    @Test
    void getForgottenPasswordInfo_shouldReturnEmail() throws Exception {
        String token = "reset-token";

        when(appUserService.getForgottenPasswordResetEmail(token)).thenReturn("petr@example.com");

        mockMvc.perform(get("/api/auth/forgotten-password/info")
                        .param("token", token))
                .andExpect(status().isOk())
                .andExpect(content().json(objectMapper.writeValueAsString(
                        Map.of("email", "petr@example.com")
                )));

        verify(appUserService).getForgottenPasswordResetEmail(token);
    }

    /**
     * Test dokončení resetu hesla.
     */
    @Test
    void forgottenPasswordReset_shouldReturnOk() throws Exception {
        ForgottenPasswordResetDTO dto = new ForgottenPasswordResetDTO();
        dto.setToken("reset-token");
        dto.setNewPassword("NewSecret123");
        dto.setNewPasswordConfirm("NewSecret123");

        doNothing().when(appUserService).forgottenPasswordReset(any(ForgottenPasswordResetDTO.class));

        mockMvc.perform(post("/api/auth/forgotten-password/reset")
                        .contentType(MediaType.APPLICATION_JSON)
                        .characterEncoding("UTF-8")
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(content().string(""));

        verify(appUserService).forgottenPasswordReset(any(ForgottenPasswordResetDTO.class));
    }
}