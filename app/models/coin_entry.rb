# frozen_string_literal: true

class CoinEntry < ApplicationRecord
  belongs_to :session
  belongs_to :user
  has_many :coin_entry_audits, dependent: :destroy

  validates :coins, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :user_id, uniqueness: { scope: :session_id, message: "already has a coin entry for this session" }

  def edited?
    updated_at > created_at + 1.second
  end
end
