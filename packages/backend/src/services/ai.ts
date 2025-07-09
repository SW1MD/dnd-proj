import OpenAI from 'openai';
import { config } from '../config';
import { logger } from '../utils/logger';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

export interface AIResponse {
  content: string;
  tokens_used: number;
  response_time: number;
}

export interface GameContext {
  gameId: string;
  characters: Array<{
    name: string;
    class: string;
    race: string;
    level: number;
    hp_current: number;
    hp_maximum: number;
  }>;
  current_scene?: string;
  recent_actions?: string[];
  campaign_style?: string;
}

export class AIDungeonMaster {
  private conversationHistory: Map<string, Array<{ role: string; content: string }>> = new Map();

  /**
   * Generate story content for a D&D campaign
   */
  async generateStory(context: GameContext, prompt: string): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      const systemPrompt = this.createSystemPrompt(context);
      const gameHistory = this.conversationHistory.get(context.gameId) || [];
      
      const messages = [
        { role: 'system', content: systemPrompt },
        ...gameHistory.slice(-10), // Keep last 10 messages for context
        { role: 'user', content: prompt }
      ];

      const response = await openai.chat.completions.create({
        model: config.openai.model,
        messages: messages as any,
        max_tokens: config.openai.maxTokens,
        temperature: 0.8,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      });

      const content = response.choices[0]?.message?.content || '';
      const tokensUsed = response.usage?.total_tokens || 0;
      const responseTime = Date.now() - startTime;

      // Update conversation history
      this.updateConversationHistory(context.gameId, [
        { role: 'user', content: prompt },
        { role: 'assistant', content: content }
      ]);

      logger.info(`AI Story generated for game ${context.gameId}: ${tokensUsed} tokens, ${responseTime}ms`);

      return {
        content,
        tokens_used: tokensUsed,
        response_time: responseTime,
      };
    } catch (error) {
      logger.error('AI Story generation error:', error);
      throw new Error('Failed to generate story content');
    }
  }

  /**
   * Generate NPC dialogue and responses
   */
  async generateNPCResponse(context: GameContext, npcName: string, npcDescription: string, playerMessage: string): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      const systemPrompt = `You are ${npcName}, a non-player character in a D&D 5e campaign. ${npcDescription}
      
      Current party: ${context.characters.map(c => `${c.name} (${c.race} ${c.class}, Level ${c.level})`).join(', ')}
      
      Respond to the player's message in character. Keep responses immersive, appropriate for D&D 5e, and helpful for advancing the story. Be concise but engaging.`;

      const response = await openai.chat.completions.create({
        model: config.openai.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: playerMessage }
        ],
        max_tokens: 300,
        temperature: 0.9,
        presence_penalty: 0.2,
      });

      const content = response.choices[0]?.message?.content || '';
      const tokensUsed = response.usage?.total_tokens || 0;
      const responseTime = Date.now() - startTime;

      logger.info(`AI NPC response generated for game ${context.gameId}: ${tokensUsed} tokens, ${responseTime}ms`);

      return {
        content,
        tokens_used: tokensUsed,
        response_time: responseTime,
      };
    } catch (error) {
      logger.error('AI NPC response error:', error);
      throw new Error('Failed to generate NPC response');
    }
  }

  /**
   * Generate random encounters
   */
  async generateEncounter(context: GameContext, location: string, difficulty: 'easy' | 'medium' | 'hard' | 'deadly'): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      const avgLevel = Math.round(context.characters.reduce((sum, c) => sum + c.level, 0) / context.characters.length);
      const partySize = context.characters.length;

      const systemPrompt = `You are a D&D 5e dungeon master creating a ${difficulty} encounter for a party of ${partySize} level ${avgLevel} characters in ${location}.
      
      Party composition: ${context.characters.map(c => `${c.name} (${c.race} ${c.class}, Level ${c.level})`).join(', ')}
      
      Generate a detailed encounter including:
      1. Setting description
      2. Enemy types and numbers (balanced for the party)
      3. Tactical considerations
      4. Potential loot or rewards
      5. Environmental features or hazards
      
      Make it engaging and appropriately challenging for the party level.`;

      const response = await openai.chat.completions.create({
        model: config.openai.model,
        messages: [{ role: 'system', content: systemPrompt }],
        max_tokens: 500,
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content || '';
      const tokensUsed = response.usage?.total_tokens || 0;
      const responseTime = Date.now() - startTime;

      logger.info(`AI Encounter generated for game ${context.gameId}: ${tokensUsed} tokens, ${responseTime}ms`);

      return {
        content,
        tokens_used: tokensUsed,
        response_time: responseTime,
      };
    } catch (error) {
      logger.error('AI Encounter generation error:', error);
      throw new Error('Failed to generate encounter');
    }
  }

  /**
   * Generate campaign ideas and hooks
   */
  async generateCampaignHook(theme: string, setting: string, partyLevel: number): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      const systemPrompt = `You are a D&D 5e dungeon master creating a campaign hook for a ${theme} campaign set in ${setting} for level ${partyLevel} characters.
      
      Generate:
      1. A compelling campaign premise
      2. Initial quest or adventure hook
      3. Key NPCs and their motivations
      4. Major conflicts or threats
      5. Potential locations and environments
      6. Unique elements that make this campaign memorable
      
      Keep it engaging and provide enough detail for a DM to start running the campaign.`;

      const response = await openai.chat.completions.create({
        model: config.openai.model,
        messages: [{ role: 'system', content: systemPrompt }],
        max_tokens: 600,
        temperature: 0.8,
      });

      const content = response.choices[0]?.message?.content || '';
      const tokensUsed = response.usage?.total_tokens || 0;
      const responseTime = Date.now() - startTime;

      logger.info(`AI Campaign hook generated: ${tokensUsed} tokens, ${responseTime}ms`);

      return {
        content,
        tokens_used: tokensUsed,
        response_time: responseTime,
      };
    } catch (error) {
      logger.error('AI Campaign hook generation error:', error);
      throw new Error('Failed to generate campaign hook');
    }
  }

  /**
   * Analyze player actions and suggest consequences
   */
  async analyzePlayerAction(context: GameContext, action: string, currentScene: string): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      const systemPrompt = `You are a D&D 5e dungeon master analyzing a player action and suggesting appropriate consequences.
      
      Current scene: ${currentScene}
      Party: ${context.characters.map(c => `${c.name} (${c.race} ${c.class}, Level ${c.level})`).join(', ')}
      Player action: ${action}
      
      Analyze the action and suggest:
      1. Immediate consequences (success/failure outcomes)
      2. Required dice rolls or skill checks
      3. Potential complications or opportunities
      4. How this advances the story
      5. Any environmental or NPC reactions
      
      Keep suggestions brief but actionable for the DM.`;

      const response = await openai.chat.completions.create({
        model: config.openai.model,
        messages: [{ role: 'system', content: systemPrompt }],
        max_tokens: 400,
        temperature: 0.6,
      });

      const content = response.choices[0]?.message?.content || '';
      const tokensUsed = response.usage?.total_tokens || 0;
      const responseTime = Date.now() - startTime;

      logger.info(`AI Action analysis generated for game ${context.gameId}: ${tokensUsed} tokens, ${responseTime}ms`);

      return {
        content,
        tokens_used: tokensUsed,
        response_time: responseTime,
      };
    } catch (error) {
      logger.error('AI Action analysis error:', error);
      throw new Error('Failed to analyze player action');
    }
  }

  /**
   * Create system prompt for story generation
   */
  private createSystemPrompt(context: GameContext): string {
    const characters = context.characters.map(c => `${c.name} (${c.race} ${c.class}, Level ${c.level}, HP: ${c.hp_current}/${c.hp_maximum})`).join(', ');
    
    return `You are an experienced D&D 5e Dungeon Master running a ${context.campaign_style || 'classic fantasy'} campaign.
    
    Current party: ${characters}
    ${context.current_scene ? `Current scene: ${context.current_scene}` : ''}
    ${context.recent_actions ? `Recent actions: ${context.recent_actions.join(', ')}` : ''}
    
    Your role:
    - Narrate the story with vivid descriptions
    - Respond to player actions with appropriate consequences
    - Create engaging NPCs and dialogue
    - Maintain game balance and fun
    - Follow D&D 5e rules and mechanics
    - Keep the story moving forward
    
    Style guidelines:
    - Use descriptive, immersive language
    - Show don't tell when possible
    - Create memorable moments and choices
    - Balance challenge with player agency
    - Maintain consistency with established lore`;
  }

  /**
   * Update conversation history for a game
   */
  private updateConversationHistory(gameId: string, messages: Array<{ role: string; content: string }>) {
    const history = this.conversationHistory.get(gameId) || [];
    history.push(...messages);
    
    // Keep only last 20 messages to manage memory
    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }
    
    this.conversationHistory.set(gameId, history);
  }

  /**
   * Clear conversation history for a game
   */
  clearGameHistory(gameId: string) {
    this.conversationHistory.delete(gameId);
  }

  /**
   * Get conversation history for a game
   */
  getGameHistory(gameId: string): Array<{ role: string; content: string }> {
    return this.conversationHistory.get(gameId) || [];
  }
}

// Export singleton instance
export const aiDungeonMaster = new AIDungeonMaster(); 