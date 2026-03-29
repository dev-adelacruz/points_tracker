# frozen_string_literal: true

FactoryBot.define do
  factory :user do
    company { Company.first || create(:company) }
    name { Faker::Name.name }
    email { Faker::Internet.email }
    password { SecureRandom.hex }
    role { :host }

    trait :admin do
      role { :admin }
    end

    trait :emcee do
      role { :emcee }
    end

    trait :host do
      role { :host }
    end
  end
end
