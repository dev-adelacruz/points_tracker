# frozen_string_literal: true

class Session < ApplicationRecord
  belongs_to :team
  belongs_to :created_by, class_name: "User"
  has_many :session_hosts, dependent: :destroy
  has_many :hosts, through: :session_hosts, source: :user

  enum :session_slot, { slot_one: 1, slot_two: 2 }, validate: true

  validates :date, presence: true
  validates :session_slot, presence: true
  validates :team_id, presence: true
  validates :created_by_id, presence: true
  validate :date_cannot_be_in_the_future
  validates :session_slot, uniqueness: { scope: [ :date, :team_id ],
    message: "a session for this date, slot, and team already exists" }

  private

  def date_cannot_be_in_the_future
    errors.add(:date, "cannot be in the future") if date.present? && date > Date.current
  end
end
