package batch

import (
	"context"
	"errors"

	"tracabilite-api/internal/groupedlist"
	"tracabilite-api/pkg/models"
)

const defaultCooperativeOrgID = "CooperativeMSP"

// CooperativeContext org ledger + acteur coop pour crédit marge.
type CooperativeContext struct {
	OrgID       string
	CoopActorID string
}

func (s *Service) resolveCooperativeFromActorID(ctx context.Context, actorID string) (CooperativeContext, error) {
	if actorID == "" {
		return CooperativeContext{OrgID: defaultCooperativeOrgID}, nil
	}
	a, err := s.actors.FindByID(ctx, actorID)
	if err != nil {
		return CooperativeContext{OrgID: defaultCooperativeOrgID}, nil
	}
	org := a.OrgID
	if org == "" {
		org = defaultCooperativeOrgID
	}
	return CooperativeContext{OrgID: org, CoopActorID: a.ID}, nil
}

func (s *Service) ResolveCooperativeForList(ctx context.Context, list groupedlist.List) (CooperativeContext, error) {
	return s.resolveCooperativeFromActorID(ctx, list.CreatedBy)
}

func (s *Service) ResolveCooperativeForBatch(ctx context.Context, _ models.Batch) (CooperativeContext, error) {
	// MVP : marge liée à la coopérative démo ; lien agri→coop en base = phase suivante.
	return CooperativeContext{OrgID: defaultCooperativeOrgID, CoopActorID: "actor-coop-001"}, nil
}

func (s *Service) GetCooperativeMarginPct(ctx context.Context, orgID string) (float64, error) {
	if orgID == "" {
		orgID = defaultCooperativeOrgID
	}
	m, err := s.fabricClient.GetCooperativeMargin(ctx, orgID)
	if err != nil {
		return 0, err
	}
	if m < 0 || m > 100 {
		return 0, errors.New("marge invalide sur le ledger")
	}
	return m, nil
}
