# frozen_string_literal: true

FactoryBot.define do
  factory :team do
    company { Company.first || create(:company) }
    name { Faker::Team.name }
    description { nil }
    active { true }

    trait :inactive do
      active { false }
    end
  end
end
