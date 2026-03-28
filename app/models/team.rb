# frozen_string_literal: true

class Team < ApplicationRecord
  has_many :team_memberships, dependent: :destroy
  has_many :users, through: :team_memberships

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
end
