package batch

import (
	"errors"
	"fmt"
	"testing"
)

func TestIsLedgerTransportError(t *testing.T) {
	t.Parallel()
	cases := []struct {
		name string
		err  error
		want bool
	}{
		{"nil", nil, false},
		{"validation", errors.New("quantite doit etre superieure a 0"), false},
		{"grpc_unavailable", errors.New(`rpc error: code = Unavailable desc = name resolver error: produced zero addresses`), true},
		{"resolver", errors.New("name resolver error: produced zero addresses"), true},
		{"conn_refused", errors.New("connection refused"), true},
		{"wrapped", fmt.Errorf("evaluate: %w", errors.New("rpc error: code = Unavailable desc = transport")), true},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := IsLedgerTransportError(tc.err); got != tc.want {
				t.Fatalf("IsLedgerTransportError(%v) = %v, want %v", tc.err, got, tc.want)
			}
		})
	}
}
