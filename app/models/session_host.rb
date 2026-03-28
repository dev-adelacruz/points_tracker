# frozen_string_literal: true

class SessionHost < ApplicationRecord
  belongs_to :session
  belongs_to :user

  validates :user_id, uniqueness: { scope: :session_id }
  validate :user_must_be_host

  private

  def user_must_be_host
    errors.add(:user, "must have the Host role") unless user&.host?
  end
end
