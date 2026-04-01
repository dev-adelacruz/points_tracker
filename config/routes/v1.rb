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
  resources :sessions, only: [ :index, :show, :create ] do
    resources :coin_entries, only: [ :index, :create ], module: "sessions"
  end

  namespace :reports do
    resource :period_comparison, only: [ :show ]
    resource :team_totals, only: [ :show ]
    resource :host_performance, only: [ :show ]
  end

  namespace :emcee do
    resources :team_host_stats, only: [ :index ]
  end
end
