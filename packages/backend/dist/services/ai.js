"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiDungeonMaster = exports.AIDungeonMaster = void 0;
const openai_1 = __importDefault(require("openai"));
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
const openai = new openai_1.default({
    apiKey: config_1.config.openai.apiKey,
});
class AIDungeonMaster {
    constructor() {
        this.conversationHistory = new Map();
    }
    async generateStory(context, prompt) {
        const startTime = Date.now();
        try {
            const systemPrompt = this.createSystemPrompt(context);
            const gameHistory = this.conversationHistory.get(context.gameId) || [];
            const messages = [
                { role: 'system', content: systemPrompt },
                ...gameHistory.slice(-10),
                { role: 'user', content: prompt }
            ];
            const response = await openai.chat.completions.create({
                model: config_1.config.openai.model,
                messages: messages,
                max_tokens: config_1.config.openai.maxTokens,
                temperature: 0.8,
                presence_penalty: 0.1,
                frequency_penalty: 0.1,
            });
            const content = response.choices[0]?.message?.content || '';
            const tokensUsed = response.usage?.total_tokens || 0;
            const responseTime = Date.now() - startTime;
            this.updateConversationHistory(context.gameId, [
                { role: 'user', content: prompt },
                { role: 'assistant', content: content }
            ]);
            logger_1.logger.info(`AI Story generated for game ${context.gameId}: ${tokensUsed} tokens, ${responseTime}ms`);
            return {
                content,
                tokens_used: tokensUsed,
                response_time: responseTime,
            };
        }
        catch (error) {
            logger_1.logger.error('AI Story generation error:', error);
            throw new Error('Failed to generate story content');
        }
    }
    async generateNPCResponse(context, npcName, npcDescription, playerMessage) {
        const startTime = Date.now();
        try {
            const systemPrompt = `You are ${npcName}, a non-player character in a D&D 5e campaign. ${npcDescription}
      
      Current party: ${context.characters.map(c => `${c.name} (${c.race} ${c.class}, Level ${c.level})`).join(', ')}
      
      Respond to the player's message in character. Keep responses immersive, appropriate for D&D 5e, and helpful for advancing the story. Be concise but engaging.`;
            const response = await openai.chat.completions.create({
                model: config_1.config.openai.model,
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
            logger_1.logger.info(`AI NPC response generated for game ${context.gameId}: ${tokensUsed} tokens, ${responseTime}ms`);
            return {
                content,
                tokens_used: tokensUsed,
                response_time: responseTime,
            };
        }
        catch (error) {
            logger_1.logger.error('AI NPC response error:', error);
            throw new Error('Failed to generate NPC response');
        }
    }
    async generateEncounter(context, location, difficulty) {
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
                model: config_1.config.openai.model,
                messages: [{ role: 'system', content: systemPrompt }],
                max_tokens: 500,
                temperature: 0.7,
            });
            const content = response.choices[0]?.message?.content || '';
            const tokensUsed = response.usage?.total_tokens || 0;
            const responseTime = Date.now() - startTime;
            logger_1.logger.info(`AI Encounter generated for game ${context.gameId}: ${tokensUsed} tokens, ${responseTime}ms`);
            return {
                content,
                tokens_used: tokensUsed,
                response_time: responseTime,
            };
        }
        catch (error) {
            logger_1.logger.error('AI Encounter generation error:', error);
            throw new Error('Failed to generate encounter');
        }
    }
    async generateCampaignHook(theme, setting, partyLevel) {
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
                model: config_1.config.openai.model,
                messages: [{ role: 'system', content: systemPrompt }],
                max_tokens: 600,
                temperature: 0.8,
            });
            const content = response.choices[0]?.message?.content || '';
            const tokensUsed = response.usage?.total_tokens || 0;
            const responseTime = Date.now() - startTime;
            logger_1.logger.info(`AI Campaign hook generated: ${tokensUsed} tokens, ${responseTime}ms`);
            return {
                content,
                tokens_used: tokensUsed,
                response_time: responseTime,
            };
        }
        catch (error) {
            logger_1.logger.error('AI Campaign hook generation error:', error);
            throw new Error('Failed to generate campaign hook');
        }
    }
    async analyzePlayerAction(context, action, currentScene) {
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
                model: config_1.config.openai.model,
                messages: [{ role: 'system', content: systemPrompt }],
                max_tokens: 400,
                temperature: 0.6,
            });
            const content = response.choices[0]?.message?.content || '';
            const tokensUsed = response.usage?.total_tokens || 0;
            const responseTime = Date.now() - startTime;
            logger_1.logger.info(`AI Action analysis generated for game ${context.gameId}: ${tokensUsed} tokens, ${responseTime}ms`);
            return {
                content,
                tokens_used: tokensUsed,
                response_time: responseTime,
            };
        }
        catch (error) {
            logger_1.logger.error('AI Action analysis error:', error);
            throw new Error('Failed to analyze player action');
        }
    }
    createSystemPrompt(context) {
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
    updateConversationHistory(gameId, messages) {
        const history = this.conversationHistory.get(gameId) || [];
        history.push(...messages);
        if (history.length > 20) {
            history.splice(0, history.length - 20);
        }
        this.conversationHistory.set(gameId, history);
    }
    clearGameHistory(gameId) {
        this.conversationHistory.delete(gameId);
    }
    getGameHistory(gameId) {
        return this.conversationHistory.get(gameId) || [];
    }
}
exports.AIDungeonMaster = AIDungeonMaster;
exports.aiDungeonMaster = new AIDungeonMaster();
//# sourceMappingURL=ai.js.map