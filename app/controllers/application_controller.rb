# frozen_string_literal: true

class ApplicationController < ActionController::Base
  include CompanyScoped

  skip_before_action :verify_authenticity_token

  private

  def authenticate_user!
    unless current_user
      render json: { status: 401, message: "Unauthorized" }, status: :unauthorized
    end
  end

  def authorize_role!(*roles)
    return if current_user&.role&.to_sym.in?(roles)

    render json: { status: 403, message: "Forbidden" }, status: :forbidden
  end

  def require_admin!
    authorize_role!(:admin)
  end
end
