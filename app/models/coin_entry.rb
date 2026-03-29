# frozen_string_literal: true

class CoinEntry < ApplicationRecord
  belongs_to :company, optional: true
  belongs_to :session
  belongs_to :user

  validates :coins, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :user_id, uniqueness: { scope: :session_id, message: "already has a coin entry for this session" }
end
