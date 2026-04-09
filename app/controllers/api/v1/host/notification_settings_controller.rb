# frozen_string_literal: true

class Api::V1::Host::NotificationSettingsController < ApplicationController
  before_action :authenticate_user!
  before_action :authorize_host!

  def show
    render json: {
      status: { code: 200, message: "Notification settings retrieved successfully." },
      data:   { email_notifications_enabled: current_user.email_notifications_enabled }
    }, status: :ok
  end

  def update
    current_user.update!(email_notifications_enabled: params.require(:email_notifications_enabled))
    render json: {
      status: { code: 200, message: "Notification settings updated successfully." },
      data:   { email_notifications_enabled: current_user.email_notifications_enabled }
    }, status: :ok
  end

  private

  def authorize_host!
    authorize_role!(:host)
  end
end
