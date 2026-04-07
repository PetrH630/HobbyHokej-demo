package cz.phsoft.hokej.registration.repositories;

import cz.phsoft.hokej.match.entities.MatchEntity;
import cz.phsoft.hokej.match.enums.MatchMode;
import cz.phsoft.hokej.match.enums.MatchStatus;
import cz.phsoft.hokej.player.entities.PlayerEntity;
import cz.phsoft.hokej.player.enums.PlayerPosition;
import cz.phsoft.hokej.player.enums.PlayerStatus;
import cz.phsoft.hokej.player.enums.PlayerType;
import cz.phsoft.hokej.registration.entities.MatchRegistrationEntity;
import cz.phsoft.hokej.registration.enums.PlayerMatchStatus;
import cz.phsoft.hokej.season.entities.SeasonEntity;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Repository testy pro MatchRegistrationRepository.
 *
 * Ověřuje se existence registrace, filtrování podle stavu
 * a deduplikace připomínek pomocí reminderAlreadySent.
 */
@DataJpaTest(properties = "spring.flyway.enabled=false")
@ActiveProfiles("test")
class MatchRegistrationRepositoryTest {

    @Autowired
    private MatchRegistrationRepository matchRegistrationRepository;

    @Autowired
    private EntityManager entityManager;

    private MatchEntity match;
    private PlayerEntity playerOne;
    private PlayerEntity playerTwo;

    @BeforeEach
    void setUp() {
        SeasonEntity season = persistSeason();
        match = persistMatch(season);
        playerOne = persistPlayer("Petr", "Hlista");
        playerTwo = persistPlayer("Jan", "Novak");
    }


    @Test
    void existsByPlayerIdAndMatchId_shouldReturnTrueWhenRegistrationExists() {
        persistRegistration(match, playerOne, PlayerMatchStatus.REGISTERED, false, LocalDateTime.of(2026, 3, 10, 10, 0));
        entityManager.flush();
        entityManager.clear();

        Boolean exists = matchRegistrationRepository.existsByPlayerIdAndMatchId(playerOne.getId(), match.getId());

        assertTrue(Boolean.TRUE.equals(exists));
    }

    @Test
    void findByPlayerIdAndMatchId_shouldReturnRegistration() {
        MatchRegistrationEntity registration = persistRegistration(
                match,
                playerOne,
                PlayerMatchStatus.REGISTERED,
                false,
                LocalDateTime.of(2026, 3, 10, 10, 0)
        );
        entityManager.flush();
        entityManager.clear();

        Optional<MatchRegistrationEntity> result = matchRegistrationRepository.findByPlayerIdAndMatchId(playerOne.getId(), match.getId());

        assertTrue(result.isPresent());
        assertEquals(registration.getId(), result.get().getId());
    }

    @Test
    void findByMatchIdAndStatus_shouldReturnOnlyMatchingStatus() {
        MatchRegistrationEntity registered = persistRegistration(
                match,
                playerOne,
                PlayerMatchStatus.REGISTERED,
                false,
                LocalDateTime.of(2026, 3, 10, 10, 0)
        );
        persistRegistration(
                match,
                playerTwo,
                PlayerMatchStatus.EXCUSED,
                false,
                LocalDateTime.of(2026, 3, 10, 11, 0)
        );
        entityManager.flush();
        entityManager.clear();

        List<MatchRegistrationEntity> result = matchRegistrationRepository.findByMatchIdAndStatus(match.getId(), PlayerMatchStatus.REGISTERED);

        assertEquals(1, result.size());
        assertEquals(registered.getId(), result.get(0).getId());
    }

    @Test
    void findByMatchIdAndStatusAndReminderAlreadySentFalse_shouldReturnOnlyPendingReminders() {
        MatchRegistrationEntity pendingReminder = persistRegistration(
                match,
                playerOne,
                PlayerMatchStatus.REGISTERED,
                false,
                LocalDateTime.of(2026, 3, 10, 10, 0)
        );
        persistRegistration(
                match,
                playerTwo,
                PlayerMatchStatus.REGISTERED,
                true,
                LocalDateTime.of(2026, 3, 10, 11, 0)
        );
        entityManager.flush();
        entityManager.clear();

        List<MatchRegistrationEntity> result = matchRegistrationRepository
                .findByMatchIdAndStatusAndReminderAlreadySentFalse(match.getId(), PlayerMatchStatus.REGISTERED);

        assertEquals(1, result.size());
        assertEquals(pendingReminder.getId(), result.get(0).getId());
        assertFalse(result.get(0).isReminderAlreadySent());
    }

    @Test
    void findByMatchIdAndStatusOrderByTimestampAsc_shouldReturnRegistrationsSortedByTimestamp() {
        MatchRegistrationEntity first = persistRegistration(
                match,
                playerOne,
                PlayerMatchStatus.REGISTERED,
                false,
                LocalDateTime.of(2026, 3, 10, 10, 0)
        );
        MatchRegistrationEntity second = persistRegistration(
                match,
                playerTwo,
                PlayerMatchStatus.REGISTERED,
                false,
                LocalDateTime.of(2026, 3, 10, 11, 0)
        );
        entityManager.flush();
        entityManager.clear();

        List<MatchRegistrationEntity> result = matchRegistrationRepository
                .findByMatchIdAndStatusOrderByTimestampAsc(match.getId(), PlayerMatchStatus.REGISTERED);

        assertEquals(2, result.size());
        assertEquals(first.getId(), result.get(0).getId());
        assertEquals(second.getId(), result.get(1).getId());
    }

    private SeasonEntity persistSeason() {
        SeasonEntity season = new SeasonEntity();
        season.setName("2025/2026");
        season.setStartDate(LocalDate.of(2025, 9, 1));
        season.setEndDate(LocalDate.of(2026, 5, 31));
        season.setActive(true);
        entityManager.persist(season);
        return season;
    }

    private MatchEntity persistMatch(SeasonEntity season) {
        MatchEntity matchEntity = new MatchEntity();
        matchEntity.setSeason(season);
        matchEntity.setDateTime(LocalDateTime.of(2026, 3, 15, 18, 0));
        matchEntity.setLocation("Ostrava");
        matchEntity.setDescription("Test registrace");
        matchEntity.setMaxPlayers(20);
        matchEntity.setPrice(200);
        matchEntity.setMatchMode(MatchMode.FIVE_ON_FIVE_WITH_GOALIE);
        matchEntity.setMatchStatus(MatchStatus.UPDATED);
        entityManager.persist(matchEntity);
        return matchEntity;
    }

    private PlayerEntity persistPlayer(String name, String surname) {
        PlayerEntity player = new PlayerEntity();
        player.setName(name);
        player.setSurname(surname);
        player.setType(PlayerType.STANDARD);
        player.setPhoneNumber("+420777123123");
        player.setPrimaryPosition(PlayerPosition.CENTER);
        player.setPlayerStatus(PlayerStatus.APPROVED);
        entityManager.persist(player);
        return player;
    }

    private MatchRegistrationEntity persistRegistration(
            MatchEntity matchEntity,
            PlayerEntity player,
            PlayerMatchStatus status,
            boolean reminderAlreadySent,
            LocalDateTime timestamp
    ) {
        MatchRegistrationEntity registration = new MatchRegistrationEntity();
        registration.setMatch(matchEntity);
        registration.setPlayer(player);
        registration.setStatus(status);
        registration.setCreatedBy("test");
        registration.setTimestamp(timestamp);
        registration.setReminderAlreadySent(reminderAlreadySent);
        entityManager.persist(registration);
        return registration;
    }
}
