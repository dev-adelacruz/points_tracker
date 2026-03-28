# frozen_string_literal: true

FactoryBot.define do
  factory :coin_entry do
    coins { rand(0..50_000) }
    association :session
    association :user, factory: [ :user, :host ]
  end
end
