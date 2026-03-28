# frozen_string_literal: true

namespace :v1 do
  draw(:devise)

  resources :users, only: [] do
    resource :role, only: [ :update ], module: "users"
  end
end
