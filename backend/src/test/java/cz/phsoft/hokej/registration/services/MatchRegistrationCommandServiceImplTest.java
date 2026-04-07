package cz.phsoft.hokej.registration.services;

import cz.phsoft.hokej.match.entities.MatchEntity;
import cz.phsoft.hokej.match.repositories.MatchRepository;
import cz.phsoft.hokej.match.services.MatchAllocationEngine;
import cz.phsoft.hokej.notifications.enums.NotificationType;
import cz.phsoft.hokej.notifications.services.NotificationService;
import cz.phsoft.hokej.notifications.sms.SmsMessageBuilder;
import cz.phsoft.hokej.notifications.sms.SmsService;
import cz.phsoft.hokej.player.entities.PlayerEntity;
import cz.phsoft.hokej.player.enums.PlayerPosition;
import cz.phsoft.hokej.player.enums.Team;
import cz.phsoft.hokej.player.repositories.PlayerRepository;
import cz.phsoft.hokej.registration.dto.MatchRegistrationDTO;
import cz.phsoft.hokej.registration.dto.MatchRegistrationRequest;
import cz.phsoft.hokej.registration.entities.MatchRegistrationEntity;
import cz.phsoft.hokej.registration.enums.ExcuseReason;
import cz.phsoft.hokej.registration.enums.PlayerMatchStatus;
import cz.phsoft.hokej.registration.exceptions.DuplicateRegistrationException;
import cz.phsoft.hokej.registration.mappers.MatchRegistrationMapper;
import cz.phsoft.hokej.registration.repositories.MatchRegistrationRepository;
import cz.phsoft.hokej.season.entities.SeasonEntity;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MatchRegistrationCommandServiceImplTest {

    @Mock
    private MatchRegistrationRepository registrationRepository;

    @Mock
    private MatchRepository matchRepository;

    @Mock
    private PlayerRepository playerRepository;

    @Mock
    private MatchRegistrationMapper matchRegistrationMapper;

    @Mock
    private SmsService smsService;

    @Mock
    private SmsMessageBuilder smsMessageBuilder;

    @Mock
    private NotificationService notificationService;

    @Mock
    private MatchAllocationEngine matchAllocationEngine;

    @InjectMocks
    private MatchRegistrationCommandServiceImpl matchRegistrationCommandService;

    // Registrace k zápasu
    @Test
    void upsertRegistration_shouldCreateNewRegisteredRegistration() {
        Long matchId = 100L;
        Long playerId = 10L;

        MatchRegistrationRequest request = new MatchRegistrationRequest();
        ReflectionTestUtils.setField(request, "matchId", matchId);

        SeasonEntity season = new SeasonEntity();
        season.setId(1L);
        season.setName("2025/2026");
        season.setStartDate(LocalDate.of(2025, 9, 1));
        season.setEndDate(LocalDate.of(2026, 6, 30));
        season.setActive(true);

        MatchEntity match = new MatchEntity();
        match.setId(matchId);
        match.setDateTime(LocalDateTime.now().plusDays(2));
        match.setMaxPlayers(20);
        match.setSeason(season);

        PlayerEntity player = new PlayerEntity();
        player.setId(playerId);
        player.setName("Jan");
        player.setSurname("NOVAK");

        MatchRegistrationEntity savedRegistration = new MatchRegistrationEntity();
        savedRegistration.setId(555L);
        savedRegistration.setMatch(match);
        savedRegistration.setPlayer(player);
        savedRegistration.setStatus(PlayerMatchStatus.REGISTERED);
        savedRegistration.setCreatedBy("user");

        MatchRegistrationDTO outputDto = new MatchRegistrationDTO();
        outputDto.setId(555L);
        outputDto.setMatchId(matchId);
        outputDto.setPlayerId(playerId);
        outputDto.setStatus(PlayerMatchStatus.REGISTERED);
        outputDto.setCreatedBy("user");

        when(matchRepository.findById(matchId)).thenReturn(Optional.of(match));
        when(playerRepository.findById(playerId)).thenReturn(Optional.of(player));
        when(registrationRepository.findByPlayerIdAndMatchId(playerId, matchId)).thenReturn(Optional.empty());
        when(registrationRepository.countByMatchIdAndStatus(matchId, PlayerMatchStatus.REGISTERED)).thenReturn(5L);
        when(registrationRepository.save(any(MatchRegistrationEntity.class))).thenReturn(savedRegistration);
        when(matchRegistrationMapper.toDTO(savedRegistration)).thenReturn(outputDto);

        MatchRegistrationDTO result = matchRegistrationCommandService.upsertRegistration(playerId, request);

        assertNotNull(result);
        assertEquals(555L, result.getId());
        assertEquals(matchId, result.getMatchId());
        assertEquals(playerId, result.getPlayerId());
        assertEquals(PlayerMatchStatus.REGISTERED, result.getStatus());
        assertEquals("user", result.getCreatedBy());

        verify(matchRepository).findById(matchId);
        verify(playerRepository).findById(playerId);
        verify(registrationRepository).findByPlayerIdAndMatchId(playerId, matchId);
        verify(registrationRepository).countByMatchIdAndStatus(matchId, PlayerMatchStatus.REGISTERED);
        verify(registrationRepository).save(any(MatchRegistrationEntity.class));
        verify(notificationService).notifyPlayer(player, NotificationType.MATCH_REGISTRATION_CREATED, savedRegistration);
        verify(matchRegistrationMapper).toDTO(savedRegistration);
    }

    // registrace k zápasu, když už má registraci
    @Test
    void upsertRegistration_shouldThrowDuplicateRegistrationException_whenAlreadyRegistered() {
        Long matchId = 100L;
        Long playerId = 10L;

        MatchRegistrationRequest request = new MatchRegistrationRequest();
        ReflectionTestUtils.setField(request, "matchId", matchId);

        SeasonEntity season = new SeasonEntity();
        season.setId(1L);
        season.setName("2025/2026");
        season.setStartDate(LocalDate.of(2025, 9, 1));
        season.setEndDate(LocalDate.of(2026, 6, 30));
        season.setActive(true);

        MatchEntity match = new MatchEntity();
        match.setId(matchId);
        match.setDateTime(LocalDateTime.now().plusDays(2));
        match.setMaxPlayers(20);
        match.setSeason(season);

        PlayerEntity player = new PlayerEntity();
        player.setId(playerId);
        player.setName("Jan");
        player.setSurname("NOVAK");

        MatchRegistrationEntity existingRegistration = new MatchRegistrationEntity();
        existingRegistration.setId(999L);
        existingRegistration.setMatch(match);
        existingRegistration.setPlayer(player);
        existingRegistration.setStatus(PlayerMatchStatus.REGISTERED);
        existingRegistration.setCreatedBy("user");

        when(matchRepository.findById(matchId)).thenReturn(Optional.of(match));
        when(playerRepository.findById(playerId)).thenReturn(Optional.of(player));
        when(registrationRepository.findByPlayerIdAndMatchId(playerId, matchId))
                .thenReturn(Optional.of(existingRegistration));

        assertThrows(
                DuplicateRegistrationException.class,
                () -> matchRegistrationCommandService.upsertRegistration(playerId, request)
        );

        verify(matchRepository).findById(matchId);
        verify(playerRepository).findById(playerId);
        verify(registrationRepository).findByPlayerIdAndMatchId(playerId, matchId);

        verify(registrationRepository, never()).countByMatchIdAndStatus(anyLong(), any());
        verify(registrationRepository, never()).save(any(MatchRegistrationEntity.class));
        verify(notificationService, never()).notifyPlayer(any(), any(), any());
        verify(matchRegistrationMapper, never()).toDTO(any());
    }

    // odhlášení ze zápasu - už má registered
    @Test
    void upsertRegistration_shouldUnregisterRegisteredPlayer() {
        Long matchId = 100L;
        Long playerId = 10L;

        MatchRegistrationRequest request = new MatchRegistrationRequest();
        ReflectionTestUtils.setField(request, "matchId", matchId);
        ReflectionTestUtils.setField(request, "unregister", true);
        ReflectionTestUtils.setField(request, "excuseReason", ExcuseReason.NEMOC);
        ReflectionTestUtils.setField(request, "excuseNote", "Jsem nemocný");

        SeasonEntity season = new SeasonEntity();
        season.setId(1L);
        season.setActive(true);

        MatchEntity match = new MatchEntity();
        match.setId(matchId);
        match.setDateTime(LocalDateTime.now().plusDays(1));
        match.setMaxPlayers(20);
        match.setSeason(season);

        PlayerEntity player = new PlayerEntity();
        player.setId(playerId);
        player.setName("Jan");
        player.setSurname("NOVAK");

        MatchRegistrationEntity existingRegistration = new MatchRegistrationEntity();
        existingRegistration.setId(500L);
        existingRegistration.setMatch(match);
        existingRegistration.setPlayer(player);
        existingRegistration.setStatus(PlayerMatchStatus.REGISTERED);
        existingRegistration.setTeam(Team.DARK);
        existingRegistration.setPositionInMatch(PlayerPosition.CENTER);

        MatchRegistrationEntity savedRegistration = new MatchRegistrationEntity();
        savedRegistration.setId(500L);
        savedRegistration.setMatch(match);
        savedRegistration.setPlayer(player);
        savedRegistration.setStatus(PlayerMatchStatus.UNREGISTERED);
        savedRegistration.setExcuseReason(ExcuseReason.NEMOC);
        savedRegistration.setExcuseNote("Jsem nemocný");
        savedRegistration.setCreatedBy("user");

        MatchRegistrationDTO outputDto = new MatchRegistrationDTO();
        outputDto.setId(500L);
        outputDto.setMatchId(matchId);
        outputDto.setPlayerId(playerId);
        outputDto.setStatus(PlayerMatchStatus.UNREGISTERED);
        outputDto.setCreatedBy("user");

        when(matchRepository.findById(matchId)).thenReturn(Optional.of(match));
        when(playerRepository.findById(playerId)).thenReturn(Optional.of(player));
        when(registrationRepository.findByPlayerIdAndMatchId(playerId, matchId))
                .thenReturn(Optional.of(existingRegistration));
        when(registrationRepository.save(existingRegistration)).thenReturn(savedRegistration);
        when(registrationRepository.findByMatchIdAndStatus(matchId, PlayerMatchStatus.RESERVED))
                .thenReturn(java.util.List.of());
        when(matchRegistrationMapper.toDTO(savedRegistration)).thenReturn(outputDto);

        MatchRegistrationDTO result = matchRegistrationCommandService.upsertRegistration(playerId, request);

        assertNotNull(result);
        assertEquals(500L, result.getId());
        assertEquals(matchId, result.getMatchId());
        assertEquals(playerId, result.getPlayerId());
        assertEquals(PlayerMatchStatus.UNREGISTERED, result.getStatus());
        assertEquals("user", result.getCreatedBy());

        assertEquals(PlayerMatchStatus.UNREGISTERED, existingRegistration.getStatus());
        assertEquals(ExcuseReason.NEMOC, existingRegistration.getExcuseReason());
        assertEquals("Jsem nemocný", existingRegistration.getExcuseNote());

        verify(matchRepository).findById(matchId);
        verify(playerRepository).findById(playerId);
        verify(registrationRepository).findByPlayerIdAndMatchId(playerId, matchId);
        verify(registrationRepository).save(existingRegistration);
        verify(registrationRepository).findByMatchIdAndStatus(matchId, PlayerMatchStatus.RESERVED);
        verify(notificationService).notifyPlayer(player, NotificationType.MATCH_REGISTRATION_CANCELED, savedRegistration);
        verify(matchRegistrationMapper).toDTO(savedRegistration);
    }

    // omluvení ze zápasu
    @Test
    void upsertRegistration_shouldCreateExcusedRegistration_whenPlayerExcusesHimself() {
        Long matchId = 200L;
        Long playerId = 20L;

        MatchRegistrationRequest request = new MatchRegistrationRequest();
        ReflectionTestUtils.setField(request, "matchId", matchId);
        ReflectionTestUtils.setField(request, "excuseReason", ExcuseReason.PRACE);
        ReflectionTestUtils.setField(request, "excuseNote", "Jsem v práci");

        SeasonEntity season = new SeasonEntity();
        season.setId(1L);
        season.setActive(true);

        MatchEntity match = new MatchEntity();
        match.setId(matchId);
        match.setDateTime(LocalDateTime.now().plusDays(2));
        match.setMaxPlayers(20);
        match.setSeason(season);

        PlayerEntity player = new PlayerEntity();
        player.setId(playerId);
        player.setName("Petr");
        player.setSurname("SVOBODA");

        MatchRegistrationEntity savedRegistration = new MatchRegistrationEntity();
        savedRegistration.setId(700L);
        savedRegistration.setMatch(match);
        savedRegistration.setPlayer(player);
        savedRegistration.setStatus(PlayerMatchStatus.EXCUSED);
        savedRegistration.setExcuseReason(ExcuseReason.PRACE);
        savedRegistration.setExcuseNote("Jsem v práci");
        savedRegistration.setCreatedBy("user");

        MatchRegistrationDTO outputDto = new MatchRegistrationDTO();
        outputDto.setId(700L);
        outputDto.setMatchId(matchId);
        outputDto.setPlayerId(playerId);
        outputDto.setStatus(PlayerMatchStatus.EXCUSED);
        outputDto.setCreatedBy("user");

        when(matchRepository.findById(matchId)).thenReturn(Optional.of(match));
        when(playerRepository.findById(playerId)).thenReturn(Optional.of(player));
        when(registrationRepository.findByPlayerIdAndMatchId(playerId, matchId))
                .thenReturn(Optional.empty());
        when(registrationRepository.save(any(MatchRegistrationEntity.class))).thenReturn(savedRegistration);
        when(matchRegistrationMapper.toDTO(savedRegistration)).thenReturn(outputDto);

        MatchRegistrationDTO result = matchRegistrationCommandService.upsertRegistration(playerId, request);

        assertNotNull(result);
        assertEquals(700L, result.getId());
        assertEquals(matchId, result.getMatchId());
        assertEquals(playerId, result.getPlayerId());
        assertEquals(PlayerMatchStatus.EXCUSED, result.getStatus());
        assertEquals("user", result.getCreatedBy());

        verify(matchRepository).findById(matchId);
        verify(playerRepository).findById(playerId);
        verify(registrationRepository).findByPlayerIdAndMatchId(playerId, matchId);
        verify(registrationRepository).save(any(MatchRegistrationEntity.class));
        verify(notificationService).notifyPlayer(player, NotificationType.PLAYER_EXCUSED, savedRegistration);
        verify(matchRegistrationMapper).toDTO(savedRegistration);
    }


}