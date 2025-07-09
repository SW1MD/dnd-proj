# Gameplay Interface Documentation

## Overview

I've created a comprehensive gameplay interface for your D&D project that provides real-time multiplayer gameplay functionality. The interface includes character management, dice rolling, chat, combat tracking, and an interactive battle map.

## Files Created/Modified

### New Files

1. **`packages/desktop/gameplay.html`** - Main gameplay interface
2. **`packages/desktop/components/map-interface.html`** - Interactive battle map component
3. **`packages/desktop/GAMEPLAY_README.md`** - This documentation file

### Modified Files

1. **`packages/backend/src/services/socket.ts`** - Enhanced with real-time gameplay events

## Features

### 1. Game Session Interface
- **3-panel layout**: Character management (left), main game area (center), chat/dice/players (right)
- **Real-time updates**: All actions are broadcast to other players instantly
- **Game header**: Shows current game name and session controls
- **Responsive design**: Adapts to different screen sizes

### 2. Character Management
- **Character sheet**: Displays ability scores, health, AC, and speed
- **Health tracking**: Visual health bar with real-time updates
- **Combat actions**: Quick access to Attack, Cast Spell, Dash, and Dodge
- **Inventory tab**: Equipment and item management

### 3. Interactive Battle Map
- **Grid-based map**: Standard D&D grid with snap-to-grid token movement
- **Token management**: Player, enemy, and NPC tokens with different colors
- **Map tools**: Select, move, measure distance, and add tokens
- **Zoom and pan**: Navigate large battle maps easily
- **Distance measurement**: Click and drag to measure distances in feet

### 4. Dice Rolling System
- **Standard dice**: d4, d6, d8, d10, d12, d20 with quick access buttons
- **Custom rolls**: Configure count, sides, and modifiers
- **Real-time broadcast**: All dice rolls are shared with other players
- **Roll history**: Track previous rolls in chat
- **Initiative rolling**: Special button for initiative rolls

### 5. Chat System
- **Real-time messaging**: Instant communication between players
- **System messages**: Automatic notifications for game events
- **Dice roll integration**: Dice results appear in chat with formatting
- **Player identification**: Each message shows the sender's name and avatar

### 6. Combat Management
- **Initiative tracker**: Visual turn order with current player highlighting
- **Turn management**: DM can advance turns
- **Health updates**: Real-time health changes for all characters
- **Combat actions**: Track player actions and abilities

### 7. Player Management
- **Active players**: See who's currently in the game
- **Online status**: Real-time connection status
- **Player avatars**: Visual identification of party members

## Technical Implementation

### Frontend Architecture
- **Grid-based layout** using CSS Grid for responsive design
- **Tab-based interface** for organizing different game aspects
- **Socket.IO integration** for real-time communication
- **Iframe integration** for the map component
- **Event-driven architecture** for handling game state changes

### Backend Integration
- **Socket.IO handlers** for real-time events:
  - `join_game` / `leave_game` - Player session management
  - `chat_message` - Real-time chat
  - `dice_roll` - Dice rolling with broadcast
  - `game_action` - Combat actions
  - `token_move` - Map token movement
  - `initiative_update` - Initiative order changes
  - `health_update` - Character health changes
  - `turn_change` - Turn management

### Real-time Events
- **Token movement**: Synchronized across all players
- **Dice rolls**: Broadcast to all players with detailed results
- **Chat messages**: Instant messaging with timestamps
- **Game actions**: Combat actions and spell casting
- **Initiative tracking**: Turn order management
- **Health updates**: Character status changes

## Usage

### Starting a Game Session
1. Navigate to the main application
2. Join an existing game or create a new one
3. Select your character
4. The gameplay interface will load at `gameplay.html?game=<gameId>`

### Basic Gameplay Flow
1. **Character Setup**: Review your character sheet and equipment
2. **Initiative**: Roll initiative when combat begins
3. **Combat**: Use action buttons or dice rolls for your turn
4. **Movement**: Move tokens on the battle map
5. **Communication**: Use chat to coordinate with other players

### Map Interface
- **Select tool**: Click tokens to select them
- **Move tool**: Drag tokens to new positions (snaps to grid)
- **Measure tool**: Click and drag to measure distances
- **Zoom**: Use mouse wheel or zoom buttons
- **Pan**: Click and drag to move the map view

### Dice Rolling
- Click standard dice buttons for quick rolls
- Use custom dice controls for specific combinations
- All rolls are automatically shared with other players
- Results appear in both the dice panel and chat

## Integration with Existing Backend

The gameplay interface integrates seamlessly with your existing backend:

- **Game sessions**: Uses existing game management endpoints
- **Character data**: Loads character information from your database
- **User authentication**: Respects existing authentication tokens
- **Socket.IO**: Extends your existing socket handlers

## Future Enhancements

### Potential Additions
1. **Character sheet editing**: Allow in-game character updates
2. **Spell management**: Track spell slots and spellcasting
3. **Inventory management**: Drag-and-drop item handling
4. **Conditions tracking**: Status effects and conditions
5. **Audio/video**: Voice chat integration
6. **Map uploads**: Custom battle map support
7. **Macros**: Automated action sequences
8. **Campaign notes**: Session notes and planning tools

### Performance Optimizations
1. **Map rendering**: Canvas-based map for better performance
2. **Event batching**: Reduce socket.io message frequency
3. **State persistence**: Save game state to database
4. **Offline support**: Local storage for temporary disconnections

## Customization

### Styling
- All CSS uses CSS custom properties (variables) for easy theming
- Dark theme optimized for long gaming sessions
- Responsive design works on tablets and mobile devices

### Configuration
- Grid size and measurement units can be adjusted in the map interface
- Dice roll formatting can be customized
- Chat message formatting is configurable

## Security Considerations

### Input Validation
- All user inputs are validated on both client and server
- Socket.IO events include user authentication checks
- Character ownership validation for updates

### Game State Protection
- Only DMs can modify certain game elements
- Players can only update their own characters
- Chat messages are filtered and logged

## Testing

### Manual Testing
1. Open multiple browser windows/tabs
2. Join the same game with different users
3. Test real-time synchronization of all features
4. Verify mobile responsiveness

### Automated Testing
- Unit tests for dice rolling functions
- Integration tests for socket.IO handlers
- End-to-end tests for complete gameplay scenarios

## Deployment

### Production Considerations
1. **Socket.IO scaling**: Consider Redis adapter for multiple servers
2. **Database optimization**: Index frequently queried game data
3. **CDN integration**: Serve static assets from CDN
4. **Error monitoring**: Track JavaScript errors and socket disconnections

The gameplay interface provides a solid foundation for real-time D&D gameplay and can be extended with additional features as needed. The modular design makes it easy to add new components and functionality while maintaining clean separation of concerns.