package cz.phsoft.hokej.match.repositories;

import cz.phsoft.hokej.match.entities.MatchEntity;
import cz.phsoft.hokej.match.enums.MatchMode;
import cz.phsoft.hokej.match.enums.MatchStatus;
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

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Repository testy pro MatchRepository.
 *
 * Ověřuje se filtrování zápasů podle času, sezóny a stavu.
 */
@DataJpaTest(properties = "spring.flyway.enabled=false")
@ActiveProfiles("test")
class MatchRepositoryTest {

    @Autowired
    private MatchRepository matchRepository;

    @Autowired
    private EntityManager entityManager;

    private SeasonEntity season2025;
    private SeasonEntity season2026;

    @BeforeEach
    void setUp() {
        season2025 = persistSeason("2025/2026", LocalDate.of(2025, 9, 1), LocalDate.of(2026, 5, 31), true);
        season2026 = persistSeason("2026/2027", LocalDate.of(2026, 9, 1), LocalDate.of(2027, 5, 31), false);
    }

    @Test
    void findByDateTimeAfterOrderByDateTimeAsc_shouldReturnUpcomingMatchesSortedAsc() {
        LocalDateTime pivot = LocalDateTime.of(2026, 3, 10, 18, 0);

        MatchEntity earliest = persistMatch(season2025, LocalDateTime.of(2026, 3, 11, 18, 0), MatchStatus.UPDATED, "Poruba");
        MatchEntity latest = persistMatch(season2025, LocalDateTime.of(2026, 3, 13, 18, 0), MatchStatus.UPDATED, "Sareza");
        persistMatch(season2025, LocalDateTime.of(2026, 3, 9, 18, 0), MatchStatus.UPDATED, "Vylouceny");

        entityManager.flush();
        entityManager.clear();

        List<MatchEntity> result = matchRepository.findByDateTimeAfterOrderByDateTimeAsc(pivot);

        assertEquals(2, result.size());
        assertEquals(earliest.getId(), result.get(0).getId());
        assertEquals(latest.getId(), result.get(1).getId());
    }

    @Test
    void findByDateTimeBeforeOrderByDateTimeDesc_shouldReturnPastMatchesSortedDesc() {
        LocalDateTime pivot = LocalDateTime.of(2026, 3, 10, 18, 0);

        MatchEntity newestPast = persistMatch(season2025, LocalDateTime.of(2026, 3, 9, 20, 0), MatchStatus.UPDATED, "Sareza");
        MatchEntity oldestPast = persistMatch(season2025, LocalDateTime.of(2026, 3, 7, 20, 0), MatchStatus.UPDATED, "Poruba");
        persistMatch(season2025, LocalDateTime.of(2026, 3, 12, 20, 0), MatchStatus.UPDATED, "Vylouceny");

        entityManager.flush();
        entityManager.clear();

        List<MatchEntity> result = matchRepository.findByDateTimeBeforeOrderByDateTimeDesc(pivot);

        assertEquals(2, result.size());
        assertEquals(newestPast.getId(), result.get(0).getId());
        assertEquals(oldestPast.getId(), result.get(1).getId());
    }

    @Test
    void findBySeasonIdAndDateTimeAfterOrderByDateTimeAsc_shouldReturnOnlyMatchesFromSelectedSeason() {
        LocalDateTime pivot = LocalDateTime.of(2026, 3, 1, 0, 0);

        MatchEntity first = persistMatch(season2025, LocalDateTime.of(2026, 3, 2, 18, 0), MatchStatus.UPDATED, "A");
        MatchEntity second = persistMatch(season2025, LocalDateTime.of(2026, 3, 4, 18, 0), MatchStatus.UPDATED, "B");
        persistMatch(season2026, LocalDateTime.of(2026, 9, 2, 18, 0), MatchStatus.UPDATED, "Cizi sezona");

        entityManager.flush();
        entityManager.clear();

        List<MatchEntity> result = matchRepository
                .findBySeasonIdAndDateTimeAfterOrderByDateTimeAsc(season2025.getId(), pivot);

        assertEquals(2, result.size());
        assertEquals(first.getId(), result.get(0).getId());
        assertEquals(second.getId(), result.get(1).getId());
    }

    @Test
    void findByDateTimeBetweenAndMatchStatusNot_shouldExcludeCanceledMatches() {
        LocalDateTime from = LocalDateTime.of(2026, 3, 10, 0, 0);
        LocalDateTime to = LocalDateTime.of(2026, 3, 12, 23, 59);

        MatchEntity active = persistMatch(season2025, LocalDateTime.of(2026, 3, 11, 18, 0), MatchStatus.UPDATED, "Aktivni");
        persistMatch(season2025, LocalDateTime.of(2026, 3, 11, 20, 0), MatchStatus.CANCELED, "Zruseny");

        entityManager.flush();
        entityManager.clear();

        List<MatchEntity> result = matchRepository.findByDateTimeBetweenAndMatchStatusNot(from, to, MatchStatus.CANCELED);

        assertEquals(1, result.size());
        assertEquals(active.getId(), result.get(0).getId());
    }

    private SeasonEntity persistSeason(String name, LocalDate start, LocalDate end, boolean active) {
        SeasonEntity season = new SeasonEntity();
        season.setName(name);
        season.setStartDate(start);
        season.setEndDate(end);
        season.setActive(active);
        entityManager.persist(season);
        return season;
    }

    private MatchEntity persistMatch(SeasonEntity season, LocalDateTime dateTime, MatchStatus matchStatus, String location) {
        MatchEntity match = new MatchEntity();
        match.setSeason(season);
        match.setDateTime(dateTime);
        match.setLocation(location);
        match.setDescription("Test match");
        match.setMaxPlayers(20);
        match.setPrice(200);
        match.setMatchMode(MatchMode.FIVE_ON_FIVE_WITH_GOALIE);
        match.setMatchStatus(matchStatus);
        entityManager.persist(match);
        return match;
    }
}
