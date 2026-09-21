package main

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestFrontendServer(t *testing.T) {
	t.Setenv("API_BASE_URL", "https://api.example.test/")
	t.Setenv("FRONTEND_URL", "https://frontend.example.test/")

	handler := newHandler()
	tests := []struct {
		name         string
		method       string
		target       string
		status       int
		bodyIncludes []string
	}{
		{
			name:         "health check",
			method:       http.MethodGet,
			target:       "/healthz",
			status:       http.StatusOK,
			bodyIncludes: []string{"ok"},
		},
		{
			name:         "home page",
			method:       http.MethodGet,
			target:       "/",
			status:       http.StatusOK,
			bodyIncludes: []string{"PunjabShip Logistics"},
		},
		{
			name:         "embedded asset",
			method:       http.MethodGet,
			target:       "/assets/PunjabShip-mark.svg",
			status:       http.StatusOK,
			bodyIncludes: []string{"<svg"},
		},
		{
			name:         "services page",
			method:       http.MethodGet,
			target:       "/services",
			status:       http.StatusOK,
			bodyIncludes: []string{"PunjabShip Logistics"},
		},
		{
			name:   "runtime config",
			method: http.MethodGet,
			target: "/config.js",
			status: http.StatusOK,
			bodyIncludes: []string{
				"https://api.example.test",
				"https://frontend.example.test",
			},
		},
		{
			name:   "missing file",
			method: http.MethodGet,
			target: "/missing.png",
			status: http.StatusNotFound,
		},
		{
			name:   "unsupported method",
			method: http.MethodPost,
			target: "/",
			status: http.StatusMethodNotAllowed,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			request := httptest.NewRequest(test.method, test.target, nil)
			recorder := httptest.NewRecorder()
			handler.ServeHTTP(recorder, request)

			if recorder.Code != test.status {
				t.Fatalf("status = %d, want %d", recorder.Code, test.status)
			}
			for _, expected := range test.bodyIncludes {
				if !strings.Contains(recorder.Body.String(), expected) {
					t.Errorf("response body does not contain %q", expected)
				}
			}
			if got := recorder.Header().Get("X-Content-Type-Options"); got != "nosniff" {
				t.Errorf("X-Content-Type-Options = %q, want nosniff", got)
			}
			if got := recorder.Header().Get("Referrer-Policy"); got != "strict-origin-when-cross-origin" {
				t.Errorf("Referrer-Policy = %q, want strict-origin-when-cross-origin", got)
			}
		})
	}
}
