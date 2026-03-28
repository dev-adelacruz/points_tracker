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
end
