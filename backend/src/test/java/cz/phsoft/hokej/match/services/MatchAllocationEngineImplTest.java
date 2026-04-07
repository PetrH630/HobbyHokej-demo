package cz.phsoft.hokej.match.services;

import cz.phsoft.hokej.match.entities.MatchEntity;
import cz.phsoft.hokej.match.enums.MatchMode;
import cz.phsoft.hokej.match.repositories.MatchRepository;
import cz.phsoft.hokej.player.entities.PlayerEntity;
import cz.phsoft.hokej.player.entities.PlayerSettingsEntity;
import cz.phsoft.hokej.player.enums.PlayerPosition;
import cz.phsoft.hokej.player.enums.Team;
import cz.phsoft.hokej.registration.dto.MatchRegistrationDTO;
import cz.phsoft.hokej.registration.entities.MatchRegistrationEntity;
import cz.phsoft.hokej.registration.enums.PlayerMatchStatus;
import cz.phsoft.hokej.registration.repositories.MatchRegistrationRepository;
import cz.phsoft.hokej.registration.services.MatchRegistrationQueryService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MatchAllocationEngineImplTest {

    @Mock
    private MatchRepository matchRepository;

    @Mock
    private MatchRegistrationRepository registrationRepository;

    @Mock
    private MatchRegistrationQueryService matchRegistrationQueryService;

    @InjectMocks
    private MatchAllocationEngineImpl matchAllocationEngine;

    /**
     * Testuje globální přepočet registrací po změně kapacity zápasu.
     *
     * V tomto scénáři:
     * - DARK tým má 3 hráče, LIGHT tým 2 hráče,
     * - při kapacitě 4 hráčů celkem vychází 2 hráči na tým,
     * - třetí hráč z DARK se může přesunout do LIGHT,
     * - následně rebalance pozic v LIGHT odsune přebytečného hráče
     *   na stejné pozici do RESERVED.
     */
    @Test
    void recomputeForMatch_shouldRebalanceTeamsAndReserveOverflowPlayerByPosition() {
        Long matchId = 1L;

        MatchEntity match = new MatchEntity();
        match.setId(matchId);
        match.setMaxPlayers(4);
        match.setMatchMode(MatchMode.FOUR_ON_FOUR_NO_GOALIE);

        PlayerEntity darkPlayer1 = createPlayer(101L, PlayerPosition.WING_LEFT, false);
        PlayerEntity darkPlayer2 = createPlayer(102L, PlayerPosition.WING_RIGHT, false);
        PlayerEntity darkPlayer3Movable = createPlayer(103L, PlayerPosition.WING_LEFT, true);
        PlayerEntity lightPlayer1 = createPlayer(201L, PlayerPosition.WING_LEFT, false);
        PlayerEntity lightPlayer2 = createPlayer(202L, PlayerPosition.WING_RIGHT, false);

        MatchRegistrationEntity reg1 = createRegistration(
                1L, match, darkPlayer1, PlayerMatchStatus.REGISTERED,
                Team.DARK, PlayerPosition.WING_LEFT, LocalDateTime.of(2026, 4, 1, 10, 0)
        );
        MatchRegistrationEntity reg2 = createRegistration(
                2L, match, darkPlayer2, PlayerMatchStatus.REGISTERED,
                Team.DARK, PlayerPosition.WING_RIGHT, LocalDateTime.of(2026, 4, 1, 10, 1)
        );
        MatchRegistrationEntity reg3 = createRegistration(
                3L, match, darkPlayer3Movable, PlayerMatchStatus.REGISTERED,
                Team.DARK, PlayerPosition.WING_LEFT, LocalDateTime.of(2026, 4, 1, 10, 2)
        );
        MatchRegistrationEntity reg4 = createRegistration(
                4L, match, lightPlayer1, PlayerMatchStatus.REGISTERED,
                Team.LIGHT, PlayerPosition.WING_LEFT, LocalDateTime.of(2026, 4, 1, 10, 3)
        );
        MatchRegistrationEntity reg5 = createRegistration(
                5L, match, lightPlayer2, PlayerMatchStatus.REGISTERED,
                Team.LIGHT, PlayerPosition.WING_RIGHT, LocalDateTime.of(2026, 4, 1, 10, 4)
        );

        List<MatchRegistrationEntity> allRegistrations = List.of(reg1, reg2, reg3, reg4, reg5);

        when(matchRepository.findById(matchId)).thenReturn(Optional.of(match));
        when(registrationRepository.findByMatchId(matchId)).thenReturn(allRegistrations);
        when(registrationRepository.saveAndFlush(any(MatchRegistrationEntity.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        matchAllocationEngine.recomputeForMatch(matchId);

        // DARK zůstane vyvážený
        assertEquals(PlayerMatchStatus.REGISTERED, reg1.getStatus());
        assertEquals(Team.DARK, reg1.getTeam());

        assertEquals(PlayerMatchStatus.REGISTERED, reg2.getStatus());
        assertEquals(Team.DARK, reg2.getTeam());

        // Třetí hráč z DARK se kvůli vyrovnání týmů přesune do LIGHT
        assertEquals(PlayerMatchStatus.REGISTERED, reg3.getStatus());
        assertEquals(Team.LIGHT, reg3.getTeam());

        // V LIGHT pak vznikne přebytek na WING_LEFT, novější hráč jde do RESERVED
        assertEquals(PlayerMatchStatus.RESERVED, reg4.getStatus());
        assertEquals(Team.LIGHT, reg4.getTeam());
        assertEquals("system", reg4.getCreatedBy());

        // Hráč na WING_RIGHT v LIGHT se po rebalance vrátí mezi REGISTERED
        assertEquals(PlayerMatchStatus.REGISTERED, reg5.getStatus());
        assertEquals(Team.LIGHT, reg5.getTeam());
        assertEquals("system", reg5.getCreatedBy());

        verify(matchRepository).findById(matchId);
        verify(registrationRepository, atLeastOnce()).findByMatchId(matchId);
        verify(registrationRepository, atLeastOnce()).saveAndFlush(any(MatchRegistrationEntity.class));
    }

    /**
     * Testuje zvýšení kapacity zápasu.
     *
     * V tomto scénáři:
     * - nový slot připadne týmu LIGHT,
     * - kandidát je v RESERVED v týmu DARK,
     * - má povolený přesun do jiného týmu,
     * - jeho aktuální pozice je v LIGHT volná,
     * - proto je povýšen na REGISTERED a přesunut do LIGHT.
     */
    @Test
    void handleCapacityIncrease_shouldPromoteReservedPlayerToRegisteredAndMoveToOtherTeam_whenPlayerAllowsMove() {
        Long matchId = 2L;

        MatchEntity match = new MatchEntity();
        match.setId(matchId);
        match.setMaxPlayers(4);
        match.setMatchMode(MatchMode.FOUR_ON_FOUR_NO_GOALIE);

        PlayerEntity darkPlayer1 = createPlayer(301L, PlayerPosition.WING_LEFT, false);
        PlayerEntity darkPlayer2 = createPlayer(302L, PlayerPosition.WING_RIGHT, false);
        PlayerEntity lightPlayer1 = createPlayer(401L, PlayerPosition.WING_LEFT, false);
        PlayerEntity reservedMovablePlayer = createPlayer(501L, PlayerPosition.WING_RIGHT, true);

        MatchRegistrationEntity registeredDark1 = createRegistration(
                11L, match, darkPlayer1, PlayerMatchStatus.REGISTERED,
                Team.DARK, PlayerPosition.WING_LEFT, LocalDateTime.of(2026, 4, 1, 9, 0)
        );
        MatchRegistrationEntity registeredDark2 = createRegistration(
                12L, match, darkPlayer2, PlayerMatchStatus.REGISTERED,
                Team.DARK, PlayerPosition.WING_RIGHT, LocalDateTime.of(2026, 4, 1, 9, 1)
        );
        MatchRegistrationEntity registeredLight1 = createRegistration(
                13L, match, lightPlayer1, PlayerMatchStatus.REGISTERED,
                Team.LIGHT, PlayerPosition.WING_LEFT, LocalDateTime.of(2026, 4, 1, 9, 2)
        );
        MatchRegistrationEntity reservedCandidate = createRegistration(
                14L, match, reservedMovablePlayer, PlayerMatchStatus.RESERVED,
                Team.DARK, PlayerPosition.WING_RIGHT, LocalDateTime.of(2026, 4, 1, 9, 3)
        );

        MatchRegistrationDTO darkDto1 = createRegistrationDto(PlayerMatchStatus.REGISTERED, Team.DARK);
        MatchRegistrationDTO darkDto2 = createRegistrationDto(PlayerMatchStatus.REGISTERED, Team.DARK);
        MatchRegistrationDTO lightDto1 = createRegistrationDto(PlayerMatchStatus.REGISTERED, Team.LIGHT);

        when(matchRegistrationQueryService.getRegistrationsForMatch(matchId))
                .thenReturn(List.of(darkDto1, darkDto2, lightDto1));

        when(registrationRepository.countByMatchIdAndStatus(matchId, PlayerMatchStatus.REGISTERED))
                .thenReturn(3L);

        when(registrationRepository.findByMatchIdAndStatus(matchId, PlayerMatchStatus.RESERVED))
                .thenReturn(List.of(reservedCandidate));

        when(registrationRepository.findByMatchIdAndStatus(matchId, PlayerMatchStatus.REGISTERED))
                .thenReturn(List.of(registeredDark1, registeredDark2, registeredLight1));

        when(registrationRepository.saveAndFlush(any(MatchRegistrationEntity.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        matchAllocationEngine.handleCapacityIncrease(match, 1);

        assertEquals(PlayerMatchStatus.REGISTERED, reservedCandidate.getStatus());
        assertEquals(Team.LIGHT, reservedCandidate.getTeam());
        assertEquals(PlayerPosition.WING_RIGHT, reservedCandidate.getPositionInMatch());
        assertEquals("system", reservedCandidate.getCreatedBy());

        verify(matchRegistrationQueryService).getRegistrationsForMatch(matchId);
        verify(registrationRepository, atLeastOnce())
                .countByMatchIdAndStatus(matchId, PlayerMatchStatus.REGISTERED);
        verify(registrationRepository).findByMatchIdAndStatus(matchId, PlayerMatchStatus.RESERVED);
        verify(registrationRepository, atLeastOnce())
                .findByMatchIdAndStatus(matchId, PlayerMatchStatus.REGISTERED);
        verify(registrationRepository).saveAndFlush(reservedCandidate);
    }

    /**
     * Testuje zvýšení kapacity zápasu bez povoleného přesunu do jiného týmu.
     *
     * V tomto scénáři:
     * - nový slot připadne týmu LIGHT,
     * - kandidát je v RESERVED v týmu DARK,
     * - ale nemá povolený přesun do jiného týmu,
     * - proto zůstane v RESERVED a nic se neuloží.
     */
    @Test
    void handleCapacityIncrease_shouldNotPromoteReservedPlayer_whenMoveToAnotherTeamIsNotAllowed() {
        Long matchId = 3L;

        MatchEntity match = new MatchEntity();
        match.setId(matchId);
        match.setMaxPlayers(4);
        match.setMatchMode(MatchMode.FOUR_ON_FOUR_NO_GOALIE);

        PlayerEntity reservedNotMovablePlayer = createPlayer(604L, PlayerPosition.WING_RIGHT, false);

        MatchRegistrationEntity reservedCandidate = createRegistration(
                24L, match, reservedNotMovablePlayer, PlayerMatchStatus.RESERVED,
                Team.DARK, PlayerPosition.WING_RIGHT, LocalDateTime.of(2026, 4, 1, 8, 3)
        );

        MatchRegistrationDTO darkDto1 = createRegistrationDto(PlayerMatchStatus.REGISTERED, Team.DARK);
        MatchRegistrationDTO darkDto2 = createRegistrationDto(PlayerMatchStatus.REGISTERED, Team.DARK);
        MatchRegistrationDTO lightDto1 = createRegistrationDto(PlayerMatchStatus.REGISTERED, Team.LIGHT);

        when(matchRegistrationQueryService.getRegistrationsForMatch(matchId))
                .thenReturn(List.of(darkDto1, darkDto2, lightDto1));

        when(registrationRepository.countByMatchIdAndStatus(matchId, PlayerMatchStatus.REGISTERED))
                .thenReturn(3L);

        when(registrationRepository.findByMatchIdAndStatus(matchId, PlayerMatchStatus.RESERVED))
                .thenReturn(List.of(reservedCandidate));

        matchAllocationEngine.handleCapacityIncrease(match, 1);

        assertEquals(PlayerMatchStatus.RESERVED, reservedCandidate.getStatus());
        assertEquals(Team.DARK, reservedCandidate.getTeam());
        assertEquals(PlayerPosition.WING_RIGHT, reservedCandidate.getPositionInMatch());
        assertEquals("user", reservedCandidate.getCreatedBy());

        verify(matchRegistrationQueryService).getRegistrationsForMatch(matchId);
        verify(registrationRepository).countByMatchIdAndStatus(matchId, PlayerMatchStatus.REGISTERED);
        verify(registrationRepository).findByMatchIdAndStatus(matchId, PlayerMatchStatus.RESERVED);
        verify(registrationRepository, never()).saveAndFlush(reservedCandidate);
    }

    /**
     * Testuje zvýšení kapacity zápasu, kdy hráč smí změnit tým,
     * ale nesmí změnit pozici.
     *
     * V tomto scénáři:
     * - nový slot připadne týmu LIGHT,
     * - kandidát je v RESERVED v týmu DARK,
     * - může se přesunout do LIGHT,
     * - ale jeho aktuální pozice CENTER je v LIGHT už obsazená,
     * - volná je jen jiná pozice,
     * - protože změna pozice není povolena, hráč zůstane RESERVED.
     */
    @Test
    void handleCapacityIncrease_shouldNotPromoteReservedPlayer_whenPositionChangeIsNotAllowedAndCurrentPositionIsFull() {
        Long matchId = 4L;

        MatchEntity match = new MatchEntity();
        match.setId(matchId);
        match.setMaxPlayers(6);
        match.setMatchMode(MatchMode.FIVE_ON_FIVE_NO_GOALIE);

        PlayerEntity darkPlayer1 = createPlayerWithSettings(
                701L, PlayerPosition.WING_LEFT, false, false
        );
        PlayerEntity darkPlayer2 = createPlayerWithSettings(
                702L, PlayerPosition.WING_RIGHT, false, false
        );
        PlayerEntity darkPlayer3 = createPlayerWithSettings(
                703L, PlayerPosition.DEFENSE_LEFT, false, false
        );

        PlayerEntity lightPlayer1 = createPlayerWithSettings(
                704L, PlayerPosition.WING_LEFT, false, false
        );
        PlayerEntity lightPlayer2 = createPlayerWithSettings(
                705L, PlayerPosition.CENTER, false, false
        );

        // Kandidát může změnit tým, ale nesmí změnit pozici.
        // Jeho aktuální pozice CENTER je v LIGHT už plná.
        PlayerEntity reservedPlayer = createPlayerWithSettings(
                706L, PlayerPosition.CENTER, true, false
        );

        MatchRegistrationEntity registeredLight1 = createRegistration(
                41L, match, lightPlayer1, PlayerMatchStatus.REGISTERED,
                Team.LIGHT, PlayerPosition.WING_LEFT, LocalDateTime.of(2026, 4, 1, 7, 0)
        );
        MatchRegistrationEntity registeredLight2 = createRegistration(
                42L, match, lightPlayer2, PlayerMatchStatus.REGISTERED,
                Team.LIGHT, PlayerPosition.CENTER, LocalDateTime.of(2026, 4, 1, 7, 1)
        );

        MatchRegistrationEntity registeredDark1 = createRegistration(
                43L, match, darkPlayer1, PlayerMatchStatus.REGISTERED,
                Team.DARK, PlayerPosition.WING_LEFT, LocalDateTime.of(2026, 4, 1, 7, 2)
        );
        MatchRegistrationEntity registeredDark2 = createRegistration(
                44L, match, darkPlayer2, PlayerMatchStatus.REGISTERED,
                Team.DARK, PlayerPosition.WING_RIGHT, LocalDateTime.of(2026, 4, 1, 7, 3)
        );
        MatchRegistrationEntity registeredDark3 = createRegistration(
                45L, match, darkPlayer3, PlayerMatchStatus.REGISTERED,
                Team.DARK, PlayerPosition.DEFENSE_LEFT, LocalDateTime.of(2026, 4, 1, 7, 4)
        );

        MatchRegistrationEntity reservedCandidate = createRegistration(
                46L, match, reservedPlayer, PlayerMatchStatus.RESERVED,
                Team.DARK, PlayerPosition.CENTER, LocalDateTime.of(2026, 4, 1, 7, 5)
        );

        MatchRegistrationDTO darkDto1 = createRegistrationDto(PlayerMatchStatus.REGISTERED, Team.DARK);
        MatchRegistrationDTO darkDto2 = createRegistrationDto(PlayerMatchStatus.REGISTERED, Team.DARK);
        MatchRegistrationDTO darkDto3 = createRegistrationDto(PlayerMatchStatus.REGISTERED, Team.DARK);
        MatchRegistrationDTO lightDto1 = createRegistrationDto(PlayerMatchStatus.REGISTERED, Team.LIGHT);
        MatchRegistrationDTO lightDto2 = createRegistrationDto(PlayerMatchStatus.REGISTERED, Team.LIGHT);

        when(matchRegistrationQueryService.getRegistrationsForMatch(matchId))
                .thenReturn(List.of(darkDto1, darkDto2, darkDto3, lightDto1, lightDto2));

        when(registrationRepository.countByMatchIdAndStatus(matchId, PlayerMatchStatus.REGISTERED))
                .thenReturn(5L);

        when(registrationRepository.findByMatchIdAndStatus(matchId, PlayerMatchStatus.RESERVED))
                .thenReturn(List.of(reservedCandidate));

        when(registrationRepository.findByMatchIdAndStatus(matchId, PlayerMatchStatus.REGISTERED))
                .thenReturn(List.of(
                        registeredLight1,
                        registeredLight2,
                        registeredDark1,
                        registeredDark2,
                        registeredDark3
                ));

        matchAllocationEngine.handleCapacityIncrease(match, 1);

        assertEquals(PlayerMatchStatus.RESERVED, reservedCandidate.getStatus());
        assertEquals(Team.DARK, reservedCandidate.getTeam());
        assertEquals(PlayerPosition.CENTER, reservedCandidate.getPositionInMatch());
        assertEquals("user", reservedCandidate.getCreatedBy());

        verify(matchRegistrationQueryService).getRegistrationsForMatch(matchId);
        verify(registrationRepository).countByMatchIdAndStatus(matchId, PlayerMatchStatus.REGISTERED);
        verify(registrationRepository).findByMatchIdAndStatus(matchId, PlayerMatchStatus.RESERVED);
        verify(registrationRepository, atLeastOnce())
                .findByMatchIdAndStatus(matchId, PlayerMatchStatus.REGISTERED);
        verify(registrationRepository, never()).saveAndFlush(reservedCandidate);
    }

    /**
     * Helper pro vytvoření hráče s výchozím nastavením:
     * - možnost přesunu mezi týmy podle parametru
     * - změna pozice vypnutá
     */
    private PlayerEntity createPlayer(Long id,
                                      PlayerPosition primaryPosition,
                                      boolean possibleMoveToAnotherTeam) {
        PlayerEntity player = new PlayerEntity();
        player.setId(id);
        player.setPrimaryPosition(primaryPosition);

        PlayerSettingsEntity settings = new PlayerSettingsEntity();
        settings.setPlayer(player);
        settings.setPossibleMoveToAnotherTeam(possibleMoveToAnotherTeam);
        settings.setPossibleChangePlayerPosition(false);

        player.setSettings(settings);
        return player;
    }

    /**
     * Helper pro vytvoření hráče s plně konfigurovatelným nastavením.
     */
    private PlayerEntity createPlayerWithSettings(Long id,
                                                  PlayerPosition primaryPosition,
                                                  boolean possibleMoveToAnotherTeam,
                                                  boolean possibleChangePlayerPosition) {
        PlayerEntity player = new PlayerEntity();
        player.setId(id);
        player.setPrimaryPosition(primaryPosition);

        PlayerSettingsEntity settings = new PlayerSettingsEntity();
        settings.setPlayer(player);
        settings.setPossibleMoveToAnotherTeam(possibleMoveToAnotherTeam);
        settings.setPossibleChangePlayerPosition(possibleChangePlayerPosition);

        player.setSettings(settings);
        return player;
    }

    /**
     * Helper pro vytvoření registrace hráče do zápasu.
     */
    private MatchRegistrationEntity createRegistration(Long id,
                                                       MatchEntity match,
                                                       PlayerEntity player,
                                                       PlayerMatchStatus status,
                                                       Team team,
                                                       PlayerPosition position,
                                                       LocalDateTime timestamp) {
        MatchRegistrationEntity registration = new MatchRegistrationEntity();
        registration.setId(id);
        registration.setMatch(match);
        registration.setPlayer(player);
        registration.setStatus(status);
        registration.setTeam(team);
        registration.setPositionInMatch(position);
        registration.setTimestamp(timestamp);
        registration.setCreatedBy("user");
        return registration;
    }

    /**
     * Helper pro zjednodušené DTO registrace používané při rozdělení nových slotů.
     */
    private MatchRegistrationDTO createRegistrationDto(PlayerMatchStatus status, Team team) {
        MatchRegistrationDTO dto = new MatchRegistrationDTO();
        dto.setStatus(status);
        dto.setTeam(team);
        return dto;
    }
}