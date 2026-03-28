# frozen_string_literal: true

class User < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  include Devise::JWT::RevocationStrategies::JTIMatcher

  devise :database_authenticatable, :registerable,
    :recoverable, :rememberable, :validatable,
    :jwt_authenticatable, jwt_revocation_strategy: self

  has_many :team_memberships, dependent: :destroy
  has_many :teams, through: :team_memberships

  enum :role, { admin: 0, emcee: 1, host: 2 }, validate: true

  scope :active_hosts, -> { host.where(active: true) }
  scope :inactive_hosts, -> { host.where(active: false) }

  validates :email, presence: true
  validates :role, presence: true
  validates :active, inclusion: { in: [ true, false ] }

  def primary_team
    teams.first
  end

  def deactivate!
    update!(active: false)
  end
end
