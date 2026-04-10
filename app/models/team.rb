# frozen_string_literal: true

class Team < ApplicationRecord
  include Auditable
  belongs_to :company, optional: true

  has_many :team_memberships, dependent: :destroy
  has_many :users, through: :team_memberships
  has_many :team_emcee_assignments, dependent: :destroy
  has_one :current_emcee_assignment, -> { active }, class_name: "TeamEmceeAssignment"
  has_one :current_emcee, through: :current_emcee_assignment, source: :user

  scope :active, -> { where(active: true) }
  scope :inactive, -> { where(active: false) }

  validates :name, presence: true, uniqueness: true
  validates :active, inclusion: { in: [ true, false ] }

  def host_count
    users.host.count
  end

  def deactivate!
    update!(active: false)
  end

  def reactivate!
    update!(active: true)
  end
end
