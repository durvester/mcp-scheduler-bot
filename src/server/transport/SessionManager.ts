import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../utils/Logger.js';

export interface Session {
  id: string;
  createdAt: Date;
  lastActivity: Date;
  isActive: boolean;
  metadata?: Record<string, any>;
}

export class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private logger: Logger;
  private cleanupInterval: NodeJS.Timeout;
  private readonly sessionTimeoutMs: number;

  constructor(sessionTimeoutMs: number = 30 * 60 * 1000) { // 30 minutes default
    this.logger = Logger.create('SessionManager');
    this.sessionTimeoutMs = sessionTimeoutMs;
    
    // Start cleanup interval every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions();
    }, 5 * 60 * 1000);
    
    this.logger.debug('SessionManager initialized', { 
      sessionTimeoutMs: this.sessionTimeoutMs,
      cleanupIntervalMs: 5 * 60 * 1000 
    });
  }

  /**
   * Create a new session with a cryptographically secure ID
   */
  createSession(metadata?: Record<string, any>): Session {
    const session: Session = {
      id: this.generateSecureSessionId(),
      createdAt: new Date(),
      lastActivity: new Date(),
      isActive: true,
      metadata
    };

    this.sessions.set(session.id, session);
    this.logger.debug('Session created', { sessionId: session.id, metadata });
    
    return session;
  }

  /**
   * Get session by ID and update last activity
   */
  getSession(sessionId: string): Session | undefined {
    const session = this.sessions.get(sessionId);
    if (session && session.isActive) {
      session.lastActivity = new Date();
      this.logger.debug('Session accessed', { sessionId });
      return session;
    }
    
    if (session && !session.isActive) {
      this.logger.debug('Attempted to access inactive session', { sessionId });
    }
    
    return undefined;
  }

  /**
   * Check if session exists and is active
   */
  isValidSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    return !!(session && session.isActive && !this.isSessionExpired(session));
  }

  /**
   * Terminate a session
   */
  terminateSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isActive = false;
      this.logger.debug('Session terminated', { sessionId });
      // Keep in map for a short time for logging purposes, will be cleaned up later
      return true;
    }
    return false;
  }

  /**
   * Update session metadata
   */
  updateSessionMetadata(sessionId: string, metadata: Record<string, any>): boolean {
    const session = this.sessions.get(sessionId);
    if (session && session.isActive) {
      session.metadata = { ...session.metadata, ...metadata };
      session.lastActivity = new Date();
      this.logger.debug('Session metadata updated', { sessionId, metadata });
      return true;
    }
    return false;
  }

  /**
   * Get all active sessions (for monitoring)
   */
  getActiveSessions(): Session[] {
    return Array.from(this.sessions.values()).filter(s => s.isActive && !this.isSessionExpired(s));
  }

  /**
   * Get session statistics
   */
  getStats(): { total: number; active: number; expired: number; inactive: number } {
    const sessions = Array.from(this.sessions.values());
    return {
      total: sessions.length,
      active: sessions.filter(s => s.isActive && !this.isSessionExpired(s)).length,
      expired: sessions.filter(s => s.isActive && this.isSessionExpired(s)).length,
      inactive: sessions.filter(s => !s.isActive).length
    };
  }

  /**
   * Cleanup expired and inactive sessions
   */
  private cleanupExpiredSessions(): void {
    const before = this.sessions.size;
    const now = new Date();
    
    for (const [sessionId, session] of this.sessions.entries()) {
      const shouldRemove = !session.isActive || this.isSessionExpired(session);
      
      // Also remove inactive sessions that have been inactive for over an hour
      const inactiveForTooLong = !session.isActive && 
        (now.getTime() - session.lastActivity.getTime()) > (60 * 60 * 1000);
      
      if (shouldRemove || inactiveForTooLong) {
        this.sessions.delete(sessionId);
        this.logger.debug('Session cleaned up', { 
          sessionId, 
          reason: shouldRemove ? 'expired/inactive' : 'inactive_too_long',
          wasActive: session.isActive,
          lastActivity: session.lastActivity
        });
      }
    }
    
    const after = this.sessions.size;
    if (before !== after) {
      this.logger.debug('Session cleanup completed', { 
        sessionsBefore: before, 
        sessionsAfter: after, 
        removedCount: before - after 
      });
    }
  }

  /**
   * Check if session has expired based on last activity
   */
  private isSessionExpired(session: Session): boolean {
    const now = new Date();
    return (now.getTime() - session.lastActivity.getTime()) > this.sessionTimeoutMs;
  }

  /**
   * Generate a cryptographically secure session ID
   * Must only contain visible ASCII characters (0x21 to 0x7E) per MCP spec
   */
  private generateSecureSessionId(): string {
    // Generate a UUID and convert to a secure format
    const uuid = uuidv4().replace(/-/g, '');
    
    // Add a timestamp component for uniqueness
    const timestamp = Date.now().toString(36);
    
    // Combine and ensure ASCII compliance
    const combined = `${timestamp}_${uuid}`;
    
    // Verify all characters are in valid ASCII range
    const isValidAscii = Array.from(combined).every(char => {
      const code = char.charCodeAt(0);
      return code >= 0x21 && code <= 0x7E;
    });
    
    if (!isValidAscii) {
      this.logger.error('Generated session ID contains invalid ASCII characters', { sessionId: combined });
      throw new Error('Failed to generate valid session ID');
    }
    
    return combined;
  }

  /**
   * Shutdown the session manager and cleanup resources
   */
  shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.logger.debug('SessionManager cleanup interval stopped');
    }
    
    const activeCount = this.getActiveSessions().length;
    this.sessions.clear();
    
    this.logger.info('SessionManager shutdown completed', { 
      terminatedActiveSessions: activeCount 
    });
  }
}