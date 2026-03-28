# frozen_string_literal: true

namespace :v1 do
  draw(:devise)

  resources :users, only: [] do
    resource :role, only: [ :update ], module: "users"
  end

  resources :teams, only: [ :index, :create, :update, :destroy ] do
    resource :emcee_assignment, only: [ :show, :update, :destroy ], module: "teams"
  end
  resources :hosts, only: [ :index, :show, :create, :update, :destroy ]
  resources :emcees, only: [ :index ]
  namespace :emcee do
    get "team_sessions", to: "team_sessions#index"
    get "team_host_stats", to: "team_host_stats#index"
  end

  namespace :host do
    get "coin_history", to: "coin_history#show"
    get "earnings_summary", to: "earnings_summary#show"
    get "leaderboard_rank", to: "leaderboard_rank#show"
  end

  get "leaderboard", to: "leaderboard#index"

  resources :sessions, only: [ :index, :show, :create, :update, :destroy ] do
    resources :coin_entries, only: [ :index, :create, :update ], module: "sessions"
  end
end
