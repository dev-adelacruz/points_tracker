# frozen_string_literal: true

FactoryBot.define do
  factory :session do
    date { Date.current }
    session_slot { :slot_one }
    association :team
    association :created_by, factory: [ :user, :emcee ]
  end
end
