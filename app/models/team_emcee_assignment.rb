# frozen_string_literal: true

class TeamEmceeAssignment < ApplicationRecord
  belongs_to :team
  belongs_to :user

  scope :active, -> { where(active: true) }

  validates :active, inclusion: { in: [ true, false ] }
  validate :user_must_be_emcee

  def deactivate!
    update!(active: false)
  end

  private

  def user_must_be_emcee
    errors.add(:user, "must have the Emcee role") unless user&.emcee?
  end
end
