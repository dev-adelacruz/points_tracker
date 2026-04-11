# frozen_string_literal: true

class Api::V1::Host::BadgesController < ApplicationController
  before_action :authenticate_user!
  before_action :authorize_host!

  def index
    badges = current_user.host_badges.order(:earned_on)

    unnotified = badges.where(notified: false)
    unnotified.update_all(notified: true) if unnotified.any?

    render json: {
      status: { code: 200, message: "Badges retrieved successfully." },
      data: HostBadgeBlueprint.render_as_hash(badges),
      new_badges: HostBadgeBlueprint.render_as_hash(unnotified)
    }, status: :ok
  end

  private

  def authorize_host!
    authorize_role!(:host)
  end
end
