package notifications

import (
	"context"
	"sync"
)

// TokenStore persiste les jetons FCM par acteur.
type TokenStore interface {
	SaveToken(ctx context.Context, actorID, token, platform string) error
	GetTokens(ctx context.Context, actorID string) ([]string, error)
	DeleteToken(ctx context.Context, actorID, token string) error
}

type memoryEntry struct {
	token    string
	platform string
}

type MemoryStore struct {
	mu     sync.RWMutex
	byActor map[string][]memoryEntry
}

func NewMemoryStore() *MemoryStore {
	return &MemoryStore{byActor: make(map[string][]memoryEntry)}
}

func (s *MemoryStore) SaveToken(_ context.Context, actorID, token, platform string) error {
	if actorID == "" || token == "" {
		return nil
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	list := s.byActor[actorID]
	for i, e := range list {
		if e.token == token {
			list[i].platform = platform
			s.byActor[actorID] = list
			return nil
		}
	}
	s.byActor[actorID] = append(list, memoryEntry{token: token, platform: platform})
	return nil
}

func (s *MemoryStore) GetTokens(_ context.Context, actorID string) ([]string, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	list := s.byActor[actorID]
	out := make([]string, 0, len(list))
	for _, e := range list {
		out = append(out, e.token)
	}
	return out, nil
}

func (s *MemoryStore) DeleteToken(_ context.Context, actorID, token string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	list := s.byActor[actorID]
	filtered := list[:0]
	for _, e := range list {
		if e.token != token {
			filtered = append(filtered, e)
		}
	}
	if len(filtered) == 0 {
		delete(s.byActor, actorID)
	} else {
		s.byActor[actorID] = filtered
	}
	return nil
}
