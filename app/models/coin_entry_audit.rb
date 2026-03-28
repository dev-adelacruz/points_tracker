# frozen_string_literal: true

class CoinEntryAudit < ApplicationRecord
  belongs_to :coin_entry
  belongs_to :edited_by, class_name: "User"

  validates :previous_coins, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
end
