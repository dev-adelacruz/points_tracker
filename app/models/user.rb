# frozen_string_literal: true

class User < ApplicationRecord
  MONTHLY_COIN_QUOTA = 300_000
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  include Devise::JWT::RevocationStrategies::JTIMatcher
  include Auditable

  belongs_to :company, optional: true

  devise :database_authenticatable, :registerable,
    :recoverable, :rememberable, :validatable,
    :jwt_authenticatable, jwt_revocation_strategy: self

  has_many :team_memberships, dependent: :destroy
  has_many :teams, through: :team_memberships

  has_many :team_emcee_assignments, dependent: :destroy
  has_many :assigned_teams, through: :team_emcee_assignments, source: :team

  has_many :host_badges, dependent: :destroy

  enum :role, { admin: 0, emcee: 1, host: 2 }, validate: true

  scope :active_hosts, -> { host.where(active: true) }
  scope :inactive_hosts, -> { host.where(active: false) }

  validates :email, presence: true
  validates :name, presence: true
  validates :role, presence: true
  validates :active, inclusion: { in: [ true, false ] }

  def primary_team
    teams.first
  end

  def deactivate!
    update!(active: false)
  end

  def reactivate!
    update!(active: true)
  end
end
