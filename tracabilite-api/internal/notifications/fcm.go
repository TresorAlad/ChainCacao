package notifications

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strings"
	"sync"

	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/messaging"
	"google.golang.org/api/option"
)

// Sender envoie des notifications push via FCM.
type Sender interface {
	SendToActor(ctx context.Context, actorID, title, body string, data map[string]string) error
	SendToToken(ctx context.Context, token, title, body string, data map[string]string) error
}

type Service struct {
	client *messaging.Client
	store  TokenStore
	mu     sync.Mutex
}

// NewService initialise FCM si FIREBASE_CREDENTIALS_JSON est défini.
func NewService(store TokenStore) (*Service, error) {
	s := &Service{store: store}
	credJSON := strings.TrimSpace(os.Getenv("FIREBASE_CREDENTIALS_JSON"))
	credPath := strings.TrimSpace(os.Getenv("FIREBASE_CREDENTIALS_FILE"))
	if credJSON == "" && credPath == "" {
		log.Print("notifications: FIREBASE_CREDENTIALS_JSON absent — push désactivées (mode log)")
		return s, nil
	}
	var opt option.ClientOption
	if credJSON != "" {
		opt = option.WithCredentialsJSON([]byte(credJSON))
	} else {
		opt = option.WithCredentialsFile(credPath)
	}
	app, err := firebase.NewApp(context.Background(), nil, opt)
	if err != nil {
		return nil, fmt.Errorf("firebase init: %w", err)
	}
	client, err := app.Messaging(context.Background())
	if err != nil {
		return nil, fmt.Errorf("firebase messaging: %w", err)
	}
	s.client = client
	log.Print("notifications: FCM initialisé")
	return s, nil
}

func (s *Service) SendToActor(ctx context.Context, actorID, title, body string, data map[string]string) error {
	if actorID == "" || s.store == nil {
		return nil
	}
	tokens, err := s.store.GetTokens(ctx, actorID)
	if err != nil {
		return err
	}
	for _, tok := range tokens {
		if err := s.SendToToken(ctx, tok, title, body, data); err != nil {
			log.Printf("notifications: échec envoi à %s: %v", actorID, err)
		}
	}
	return nil
}

func (s *Service) SendToToken(ctx context.Context, token, title, body string, data map[string]string) error {
	if token == "" {
		return nil
	}
	if data == nil {
		data = map[string]string{}
	}
	if s.client == nil {
		payload, _ := json.Marshal(map[string]any{
			"token": token, "title": title, "body": body, "data": data,
		})
		log.Printf("notifications (dry-run): %s", string(payload))
		return nil
	}
	msg := &messaging.Message{
		Token: token,
		Notification: &messaging.Notification{
			Title: title,
			Body:  body,
		},
		Data: data,
		Android: &messaging.AndroidConfig{
			Priority: "high",
			Notification: &messaging.AndroidNotification{
				ChannelID: "chaincacao_default",
				Priority:  messaging.PriorityHigh,
			},
		},
	}
	_, err := s.client.Send(ctx, msg)
	return err
}

// NotifyPaymentSeller message pour agriculteur / coopérative.
func NotifyPaymentSeller(ctx context.Context, s Sender, sellerID, lotID string, montant float64) {
	if s == nil || sellerID == "" {
		return
	}
	body := fmt.Sprintf("Montant reçu du lot %s — %.0f FCFA", lotID, montant)
	_ = s.SendToActor(ctx, sellerID, "Paiement reçu", body, map[string]string{
		"type":   "payment",
		"lot_id": lotID,
		"screen": "portefeuille",
	})
}

// NotifyWalletCredit pour exportateur / transformateur / tout acteur.
func NotifyWalletCredit(ctx context.Context, s Sender, actorID string, montant float64, lotID string) {
	if s == nil || actorID == "" {
		return
	}
	var body string
	if lotID != "" {
		body = fmt.Sprintf("Virement reçu — %.0f FCFA pour le lot %s", montant, lotID)
	} else {
		body = fmt.Sprintf("Virement reçu — %.0f FCFA crédités sur votre compte", montant)
	}
	_ = s.SendToActor(ctx, actorID, "Virement reçu", body, map[string]string{
		"type":   "wallet_credit",
		"lot_id": lotID,
		"screen": "portefeuille",
	})
}

// NotifyLotTransit nouveau lot en transit.
func NotifyLotTransit(ctx context.Context, s Sender, toActorID, lotID string) {
	if s == nil || toActorID == "" {
		return
	}
	body := fmt.Sprintf("Nouveau lot %s en transit vers vous", lotID)
	_ = s.SendToActor(ctx, toActorID, "Lot en transit", body, map[string]string{
		"type":   "lot_transit",
		"lot_id": lotID,
		"screen": "lots",
	})
}

// NotifyLotReception confirmée pour l'expéditeur.
func NotifyLotReception(ctx context.Context, s Sender, senderID, lotID, recipientName string) {
	if s == nil || senderID == "" {
		return
	}
	body := fmt.Sprintf("Lot %s réceptionné par %s", lotID, recipientName)
	_ = s.SendToActor(ctx, senderID, "Réception confirmée", body, map[string]string{
		"type":   "lot_reception",
		"lot_id": lotID,
		"screen": "lots",
	})
}

// NotifyDeposit dépôt portefeuille.
func NotifyDeposit(ctx context.Context, s Sender, actorID string, montant float64) {
	if s == nil || actorID == "" {
		return
	}
	body := fmt.Sprintf("Dépôt crédité — %.0f FCFA sur votre compte", montant)
	_ = s.SendToActor(ctx, actorID, "Dépôt effectué", body, map[string]string{
		"type":   "deposit",
		"screen": "portefeuille",
	})
}
