# frozen_string_literal: true

module HostScoped
  extend ActiveSupport::Concern

  private

  def authorize_host_access!(host)
    return if current_user.admin?
    return if current_user.emcee?
    return if current_user == host

    render json: { status: 403, message: "Forbidden" }, status: :forbidden
  end
end
