package cz.phsoft.hokej.season.repositories;

import cz.phsoft.hokej.season.entities.SeasonEntity;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Repository testy pro SeasonRepository.
 *
 * Ověřuje se aktivní sezóna a detekce časových překryvů.
 */
@DataJpaTest(properties = "spring.flyway.enabled=false")
@ActiveProfiles("test")
class SeasonRepositoryTest {

    @Autowired
    private SeasonRepository seasonRepository;

    @Autowired
    private EntityManager entityManager;

    @Test
    void findByActiveTrue_shouldReturnActiveSeason() {
        persistSeason("2024/2025", LocalDate.of(2024, 9, 1), LocalDate.of(2025, 5, 31), false);
        SeasonEntity active = persistSeason("2025/2026", LocalDate.of(2025, 9, 1), LocalDate.of(2026, 5, 31), true);
        entityManager.flush();
        entityManager.clear();

        Optional<SeasonEntity> result = seasonRepository.findByActiveTrue();

        assertTrue(result.isPresent());
        assertEquals(active.getId(), result.get().getId());
    }

    @Test
    void existsByStartDateLessThanEqualAndEndDateGreaterThanEqual_shouldDetectOverlap() {
        persistSeason("2025/2026", LocalDate.of(2025, 9, 1), LocalDate.of(2026, 5, 31), true);
        entityManager.flush();
        entityManager.clear();

        boolean overlap = seasonRepository.existsByStartDateLessThanEqualAndEndDateGreaterThanEqual(
                LocalDate.of(2026, 2, 1),
                LocalDate.of(2026, 1, 1)
        );

        assertTrue(overlap);
    }

    @Test
    void existsByStartDateLessThanEqualAndEndDateGreaterThanEqualAndIdNot_shouldIgnoreCurrentSeasonId() {
        SeasonEntity season = persistSeason("2025/2026", LocalDate.of(2025, 9, 1), LocalDate.of(2026, 5, 31), true);
        entityManager.flush();
        entityManager.clear();

        boolean overlapOutsideCurrentId = seasonRepository.existsByStartDateLessThanEqualAndEndDateGreaterThanEqualAndIdNot(
                LocalDate.of(2026, 2, 1),
                LocalDate.of(2026, 1, 1),
                season.getId()
        );

        assertFalse(overlapOutsideCurrentId);
    }

    private SeasonEntity persistSeason(String name, LocalDate startDate, LocalDate endDate, boolean active) {
        SeasonEntity season = new SeasonEntity();
        season.setName(name);
        season.setStartDate(startDate);
        season.setEndDate(endDate);
        season.setActive(active);
        entityManager.persist(season);
        return season;
    }
}
