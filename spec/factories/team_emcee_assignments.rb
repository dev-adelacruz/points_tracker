# frozen_string_literal: true

FactoryBot.define do
  factory :team_emcee_assignment do
    team
    association :user, factory: [ :user, :emcee ]
    active { true }

    trait :inactive do
      active { false }
    end
  end
end
