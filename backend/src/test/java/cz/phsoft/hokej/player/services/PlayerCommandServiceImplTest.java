package cz.phsoft.hokej.player.services;

import cz.phsoft.hokej.notifications.enums.NotificationType;
import cz.phsoft.hokej.notifications.services.NotificationService;
import cz.phsoft.hokej.player.dto.PlayerDTO;
import cz.phsoft.hokej.player.entities.PlayerEntity;
import cz.phsoft.hokej.player.enums.PlayerPosition;
import cz.phsoft.hokej.player.enums.PlayerStatus;
import cz.phsoft.hokej.player.enums.PlayerType;
import cz.phsoft.hokej.player.enums.Team;
import cz.phsoft.hokej.player.exceptions.DuplicateNameSurnameException;
import cz.phsoft.hokej.player.mappers.PlayerMapper;
import cz.phsoft.hokej.player.repositories.PlayerRepository;
import cz.phsoft.hokej.user.entities.AppUserEntity;
import cz.phsoft.hokej.user.repositories.AppUserRepository;
import cz.phsoft.hokej.user.services.AppUserSettingsService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PlayerCommandServiceImplTest {

    @Mock
    private PlayerRepository playerRepository;

    @Mock
    private PlayerMapper playerMapper;

    @Mock
    private AppUserRepository appUserRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private CurrentPlayerService currentPlayerService;

    @Mock
    private AppUserSettingsService appUserSettingsService;

    @Mock
    private PlayerSettingsService playerSettingsService;

    @InjectMocks
    private PlayerCommandServiceImpl playerCommandService;

    @Test
    void createPlayer_shouldCreateAndReturnPlayer() {
        PlayerDTO inputDto = new PlayerDTO();
        inputDto.setName("Jan");
        inputDto.setSurname("Novak");
        inputDto.setNickname("Honzik");
        inputDto.setPhoneNumber("+420123456789");
        inputDto.setType(PlayerType.BASIC);
        inputDto.setTeam(Team.DARK);
        inputDto.setPrimaryPosition(PlayerPosition.CENTER);
        inputDto.setSecondaryPosition(PlayerPosition.WING_LEFT);
        inputDto.setPlayerStatus(PlayerStatus.PENDING);

        PlayerEntity mappedEntity = new PlayerEntity();
        mappedEntity.setName("Jan");
        mappedEntity.setSurname("NOVAK");
        mappedEntity.setNickname("Honzik");
        mappedEntity.setPhoneNumber("+420123456789");
        mappedEntity.setType(PlayerType.BASIC);
        mappedEntity.setTeam(Team.DARK);
        mappedEntity.setPrimaryPosition(PlayerPosition.CENTER);
        mappedEntity.setSecondaryPosition(PlayerPosition.WING_LEFT);
        mappedEntity.setPlayerStatus(PlayerStatus.PENDING);

        PlayerEntity savedEntity = new PlayerEntity();
        savedEntity.setId(1L);
        savedEntity.setName("Jan");
        savedEntity.setSurname("NOVAK");
        savedEntity.setNickname("Honzik");
        savedEntity.setPhoneNumber("+420123456789");
        savedEntity.setType(PlayerType.BASIC);
        savedEntity.setTeam(Team.DARK);
        savedEntity.setPrimaryPosition(PlayerPosition.CENTER);
        savedEntity.setSecondaryPosition(PlayerPosition.WING_LEFT);
        savedEntity.setPlayerStatus(PlayerStatus.PENDING);

        PlayerDTO outputDto = new PlayerDTO();
        outputDto.setId(1L);
        outputDto.setName("Jan");
        outputDto.setSurname("Novak");
        outputDto.setNickname("Honzik");
        outputDto.setPhoneNumber("+420123456789");
        outputDto.setType(PlayerType.BASIC);
        outputDto.setTeam(Team.DARK);
        outputDto.setPrimaryPosition(PlayerPosition.CENTER);
        outputDto.setSecondaryPosition(PlayerPosition.WING_LEFT);
        outputDto.setPlayerStatus(PlayerStatus.PENDING);

        when(playerRepository.findByNameAndSurname("Jan", "NOVAK")).thenReturn(Optional.empty());
        when(playerMapper.toEntity(inputDto)).thenReturn(mappedEntity);
        when(playerRepository.save(mappedEntity)).thenReturn(savedEntity);
        when(playerMapper.toDTO(savedEntity)).thenReturn(outputDto);

        PlayerDTO result = playerCommandService.createPlayer(inputDto);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("Jan", result.getName());
        assertEquals("NOVAK", result.getSurname());
        assertEquals("Honzik", result.getNickname());
        assertEquals("+420123456789", result.getPhoneNumber());
        assertEquals(PlayerType.BASIC, result.getType());
        assertEquals(Team.DARK, result.getTeam());
        assertEquals(PlayerPosition.CENTER, result.getPrimaryPosition());
        assertEquals(PlayerPosition.WING_LEFT, result.getSecondaryPosition());
        assertEquals(PlayerStatus.PENDING, result.getPlayerStatus());

        verify(playerRepository).findByNameAndSurname("Jan", "NOVAK");
        verify(playerMapper).toEntity(inputDto);
        verify(playerRepository).save(mappedEntity);
        verify(playerMapper).toDTO(savedEntity);
    }

    @Test
    void createPlayer_shouldThrowDuplicateNameSurnameException_whenPlayerAlreadyExists() {
        PlayerDTO inputDto = new PlayerDTO();
        inputDto.setName("Jan");
        inputDto.setSurname("NOVAK");

        PlayerEntity existingPlayer = new PlayerEntity();
        existingPlayer.setId(99L);
        existingPlayer.setName("Jan");
        existingPlayer.setSurname("NOVAK");

        when(playerRepository.findByNameAndSurname("Jan", "NOVAK"))
                .thenReturn(Optional.of(existingPlayer));

        assertThrows(
                DuplicateNameSurnameException.class,
                () -> playerCommandService.createPlayer(inputDto)
        );

        verify(playerRepository).findByNameAndSurname("Jan", "NOVAK");
        verify(playerRepository, never()).save(any(PlayerEntity.class));
        verify(playerMapper, never()).toEntity(any(PlayerDTO.class));
        verify(playerMapper, never()).toDTO(any(PlayerEntity.class));
    }

    @Test
    void createPlayerForUser_shouldCreatePlayerAssignUserAndReturnPlayer() {
        PlayerDTO inputDto = new PlayerDTO();
        inputDto.setName("Petr");
        inputDto.setSurname("Novotný");
        inputDto.setNickname("Pedro");
        inputDto.setPhoneNumber("+420777888999");
        inputDto.setType(PlayerType.BASIC);
        inputDto.setTeam(Team.LIGHT);
        inputDto.setPrimaryPosition(PlayerPosition.CENTER);
        inputDto.setSecondaryPosition(PlayerPosition.WING_RIGHT);
        inputDto.setPlayerStatus(PlayerStatus.PENDING);

        String userEmail = "petr@example.com";

        AppUserEntity user = new AppUserEntity();
        user.setId(10L);
        user.setEmail(userEmail);

        PlayerEntity mappedEntity = new PlayerEntity();
        mappedEntity.setName("Petr");
        mappedEntity.setSurname("NOVOTNÝ");
        mappedEntity.setNickname("Pedro");
        mappedEntity.setPhoneNumber("+420777888999");
        mappedEntity.setType(PlayerType.BASIC);
        mappedEntity.setTeam(Team.LIGHT);
        mappedEntity.setPrimaryPosition(PlayerPosition.CENTER);
        mappedEntity.setSecondaryPosition(PlayerPosition.WING_RIGHT);
        mappedEntity.setPlayerStatus(PlayerStatus.PENDING);

        PlayerEntity savedEntity = new PlayerEntity();
        savedEntity.setId(2L);
        savedEntity.setName("Petr");
        savedEntity.setSurname("NOVOTNÝ");
        savedEntity.setNickname("Pedro");
        savedEntity.setPhoneNumber("+420777888999");
        savedEntity.setType(PlayerType.BASIC);
        savedEntity.setTeam(Team.LIGHT);
        savedEntity.setPrimaryPosition(PlayerPosition.CENTER);
        savedEntity.setSecondaryPosition(PlayerPosition.WING_RIGHT);
        savedEntity.setPlayerStatus(PlayerStatus.PENDING);
        savedEntity.setUser(user);

        PlayerDTO outputDto = new PlayerDTO();
        outputDto.setId(2L);
        outputDto.setName("Petr");
        outputDto.setSurname("NOVOTNÝ");
        outputDto.setNickname("Pedro");
        outputDto.setPhoneNumber("+420777888999");
        outputDto.setType(PlayerType.BASIC);
        outputDto.setTeam(Team.LIGHT);
        outputDto.setPrimaryPosition(PlayerPosition.CENTER);
        outputDto.setSecondaryPosition(PlayerPosition.WING_RIGHT);
        outputDto.setPlayerStatus(PlayerStatus.PENDING);

        when(appUserRepository.findByEmail(userEmail)).thenReturn(Optional.of(user));
        when(playerRepository.findByNameAndSurname("Petr", "NOVOTNÝ")).thenReturn(Optional.empty());
        when(playerMapper.toEntity(inputDto)).thenReturn(mappedEntity);
        when(playerRepository.save(mappedEntity)).thenReturn(savedEntity);
        when(playerMapper.toDTO(savedEntity)).thenReturn(outputDto);

        PlayerDTO result = playerCommandService.createPlayerForUser(inputDto, userEmail);

        assertNotNull(result);
        assertEquals(2L, result.getId());
        assertEquals("Petr", result.getName());
        assertEquals("NOVOTNÝ", result.getSurname());
        assertEquals("Pedro", result.getNickname());
        assertEquals("+420777888999", result.getPhoneNumber());
        assertEquals(PlayerType.BASIC, result.getType());
        assertEquals(Team.LIGHT, result.getTeam());
        assertEquals(PlayerPosition.CENTER, result.getPrimaryPosition());
        assertEquals(PlayerPosition.WING_RIGHT, result.getSecondaryPosition());
        assertEquals(PlayerStatus.PENDING, result.getPlayerStatus());

        assertEquals(user, mappedEntity.getUser());

        verify(appUserRepository).findByEmail(userEmail);
        verify(playerRepository).findByNameAndSurname("Petr", "NOVOTNÝ");
        verify(playerMapper).toEntity(inputDto);
        verify(playerRepository).save(mappedEntity);
        verify(notificationService).notifyPlayer(savedEntity, NotificationType.PLAYER_CREATED, savedEntity);
        verify(playerMapper).toDTO(savedEntity);
    }

    @Test
    void updatePlayer_shouldUpdateExistingPlayerAndReturnUpdatedPlayer() {
        Long playerId = 1L;

        PlayerDTO inputDto = new PlayerDTO();
        inputDto.setName("Jan");
        inputDto.setSurname("Svoboda");
        inputDto.setNickname("Johnny");
        inputDto.setPhoneNumber("+420111222333");
        inputDto.setType(PlayerType.BASIC);
        inputDto.setTeam(Team.LIGHT);
        inputDto.setPrimaryPosition(PlayerPosition.GOALIE);
        inputDto.setSecondaryPosition(PlayerPosition.DEFENSE);
        inputDto.setPlayerStatus(PlayerStatus.APPROVED);

        PlayerEntity existingPlayer = new PlayerEntity();
        existingPlayer.setId(playerId);
        existingPlayer.setName("Jan");
        existingPlayer.setSurname("NOVAK");
        existingPlayer.setNickname("Honzik");
        existingPlayer.setPhoneNumber("+420123456789");
        existingPlayer.setType(PlayerType.BASIC);
        existingPlayer.setTeam(Team.DARK);
        existingPlayer.setPrimaryPosition(PlayerPosition.CENTER);
        existingPlayer.setSecondaryPosition(PlayerPosition.WING_LEFT);
        existingPlayer.setPlayerStatus(PlayerStatus.PENDING);

        PlayerEntity savedEntity = new PlayerEntity();
        savedEntity.setId(playerId);
        savedEntity.setName("Jan");
        savedEntity.setSurname("SVOBODA");
        savedEntity.setNickname("Johnny");
        savedEntity.setPhoneNumber("+420111222333");
        savedEntity.setType(PlayerType.BASIC);
        savedEntity.setTeam(Team.LIGHT);
        savedEntity.setPrimaryPosition(PlayerPosition.GOALIE);
        savedEntity.setSecondaryPosition(PlayerPosition.DEFENSE);
        savedEntity.setPlayerStatus(PlayerStatus.APPROVED);

        PlayerDTO outputDto = new PlayerDTO();
        outputDto.setId(playerId);
        outputDto.setName("Jan");
        outputDto.setSurname("Svoboda");
        outputDto.setNickname("Johnny");
        outputDto.setPhoneNumber("+420111222333");
        outputDto.setType(PlayerType.BASIC);
        outputDto.setTeam(Team.LIGHT);
        outputDto.setPrimaryPosition(PlayerPosition.GOALIE);
        outputDto.setSecondaryPosition(PlayerPosition.DEFENSE);
        outputDto.setPlayerStatus(PlayerStatus.APPROVED);

        when(playerRepository.findById(playerId)).thenReturn(Optional.of(existingPlayer));
        when(playerRepository.findByNameAndSurname("Jan", "SVOBODA")).thenReturn(Optional.empty());
        when(playerRepository.save(existingPlayer)).thenReturn(savedEntity);
        when(playerMapper.toDTO(savedEntity)).thenReturn(outputDto);

        PlayerDTO result = playerCommandService.updatePlayer(playerId, inputDto);

        assertNotNull(result);
        assertEquals(playerId, result.getId());
        assertEquals("Jan", result.getName());
        assertEquals("SVOBODA", result.getSurname());
        assertEquals("Johnny", result.getNickname());
        assertEquals("+420111222333", result.getPhoneNumber());
        assertEquals(PlayerType.BASIC, result.getType());
        assertEquals(Team.LIGHT, result.getTeam());
        assertEquals(PlayerPosition.GOALIE, result.getPrimaryPosition());
        assertEquals(PlayerPosition.DEFENSE, result.getSecondaryPosition());
        assertEquals(PlayerStatus.APPROVED, result.getPlayerStatus());

        assertEquals("Jan", existingPlayer.getName());
        assertEquals("SVOBODA", existingPlayer.getSurname());
        assertEquals("Johnny", existingPlayer.getNickname());
        assertEquals("+420111222333", existingPlayer.getPhoneNumber());
        assertEquals(PlayerType.BASIC, existingPlayer.getType());
        assertEquals(Team.LIGHT, existingPlayer.getTeam());
        assertEquals(PlayerPosition.GOALIE, existingPlayer.getPrimaryPosition());
        assertEquals(PlayerPosition.DEFENSE, existingPlayer.getSecondaryPosition());
        assertEquals(PlayerStatus.APPROVED, existingPlayer.getPlayerStatus());

        verify(playerRepository).findById(playerId);
        verify(playerRepository).findByNameAndSurname("Jan", "SVOBODA");
        verify(playerRepository).save(existingPlayer);
        verify(notificationService).notifyPlayer(savedEntity, NotificationType.PLAYER_UPDATED, savedEntity);
        verify(playerMapper).toDTO(savedEntity);
    }

}