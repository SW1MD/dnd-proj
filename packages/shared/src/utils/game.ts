import { GameSession, GameStatus, Player, GameAction, GameEvent } from '../types/game';

export function createGameSession(
  name: string,
  description: string,
  dmUserId: string,
  maxPlayers: number = 6
): Omit<GameSession, 'id' | 'createdAt' | 'updatedAt' | 'lastActiveAt'> {
  return {
    name,
    description,
    dmUserId,
    maxPlayers,
    currentPlayers: [],
    status: 'waiting',
    gameState: {},
    actions: [],
    events: [],
    diceRolls: [],
  };
}

export function canPlayerJoin(session: GameSession, playerId: string): boolean {
  if (session.currentPlayers.length >= session.maxPlayers) {
    return false;
  }
  
  return !session.currentPlayers.some(player => player.userId === playerId);
}

export function addPlayerToSession(session: GameSession, player: Player): GameSession {
  if (!canPlayerJoin(session, player.userId)) {
    throw new Error('Player cannot join this session');
  }

  return {
    ...session,
    currentPlayers: [...session.currentPlayers, player],
    updatedAt: new Date(),
    lastActiveAt: new Date(),
  };
}

export function removePlayerFromSession(session: GameSession, playerId: string): GameSession {
  return {
    ...session,
    currentPlayers: session.currentPlayers.filter(player => player.userId !== playerId),
    updatedAt: new Date(),
    lastActiveAt: new Date(),
  };
}

export function updatePlayerStatus(session: GameSession, playerId: string, isOnline: boolean): GameSession {
  const updatedPlayers = session.currentPlayers.map(player =>
    player.userId === playerId 
      ? { ...player, isOnline, lastActiveAt: new Date() }
      : player
  );

  return {
    ...session,
    currentPlayers: updatedPlayers,
    updatedAt: new Date(),
    lastActiveAt: new Date(),
  };
}

export function startGame(session: GameSession): GameSession {
  if (session.status !== 'waiting') {
    throw new Error('Game can only be started from waiting status');
  }

  if (session.currentPlayers.length === 0) {
    throw new Error('Cannot start game with no players');
  }

  return {
    ...session,
    status: 'active',
    updatedAt: new Date(),
    lastActiveAt: new Date(),
  };
}

export function pauseGame(session: GameSession): GameSession {
  if (session.status !== 'active') {
    throw new Error('Can only pause an active game');
  }

  return {
    ...session,
    status: 'paused',
    updatedAt: new Date(),
    lastActiveAt: new Date(),
  };
}

export function resumeGame(session: GameSession): GameSession {
  if (session.status !== 'paused') {
    throw new Error('Can only resume a paused game');
  }

  return {
    ...session,
    status: 'active',
    updatedAt: new Date(),
    lastActiveAt: new Date(),
  };
}

export function endGame(session: GameSession): GameSession {
  if (session.status === 'completed') {
    throw new Error('Game is already completed');
  }

  return {
    ...session,
    status: 'completed',
    updatedAt: new Date(),
    lastActiveAt: new Date(),
  };
}

export function addGameAction(session: GameSession, action: GameAction): GameSession {
  return {
    ...session,
    actions: [...session.actions, action],
    updatedAt: new Date(),
    lastActiveAt: new Date(),
  };
}

export function resolveGameAction(session: GameSession, actionId: string): GameSession {
  const updatedActions = session.actions.map(action =>
    action.id === actionId ? { ...action, resolved: true } : action
  );

  return {
    ...session,
    actions: updatedActions,
    updatedAt: new Date(),
    lastActiveAt: new Date(),
  };
}

export function addGameEvent(session: GameSession, event: GameEvent): GameSession {
  return {
    ...session,
    events: [...session.events, event],
    updatedAt: new Date(),
    lastActiveAt: new Date(),
  };
}

export function updateGameState(session: GameSession, key: string, value: any): GameSession {
  return {
    ...session,
    gameState: {
      ...session.gameState,
      [key]: value,
    },
    updatedAt: new Date(),
    lastActiveAt: new Date(),
  };
}

export function getActivePlayersCount(session: GameSession): number {
  return session.currentPlayers.filter(player => player.isOnline).length;
}

export function getPlayerById(session: GameSession, playerId: string): Player | undefined {
  return session.currentPlayers.find(player => player.id === playerId);
}

export function getPlayerByUserId(session: GameSession, userId: string): Player | undefined {
  return session.currentPlayers.find(player => player.userId === userId);
}

export function getUnresolvedActions(session: GameSession): GameAction[] {
  return session.actions.filter(action => !action.resolved);
}

export function getRecentEvents(session: GameSession, limit: number = 10): GameEvent[] {
  return session.events
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);
}

export function isGameActive(session: GameSession): boolean {
  return session.status === 'active';
}

export function canPerformAction(session: GameSession, playerId: string): boolean {
  if (!isGameActive(session)) {
    return false;
  }

  const player = getPlayerById(session, playerId);
  return player ? player.isOnline : false;
}

export function getGameDuration(session: GameSession): number {
  if (!session.createdAt || !session.lastActiveAt) {
    return 0;
  }

  return session.lastActiveAt.getTime() - session.createdAt.getTime();
} 