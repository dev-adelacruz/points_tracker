# frozen_string_literal: true

class Company < ApplicationRecord
  has_many :teams, dependent: :restrict_with_error
  has_many :users, dependent: :restrict_with_error
  has_many :sessions, dependent: :restrict_with_error
  has_many :coin_entries, dependent: :restrict_with_error

  validates :name, presence: true
end
