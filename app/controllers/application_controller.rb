# frozen_string_literal: true

class ApplicationController < ActionController::Base
  include CompanyScoped

  skip_before_action :verify_authenticity_token
  before_action :configure_permitted_parameters, if: :devise_controller?

  private

  def configure_permitted_parameters
    devise_parameter_sanitizer.permit(:sign_up, keys: [ :name ])
  end

  def authenticate_user!
    unless current_user
      render json: { status: 401, message: "Unauthorized" }, status: :unauthorized
      return
    end

    Current.user = current_user
  end

  def authorize_role!(*roles)
    return if current_user&.role&.to_sym.in?(roles)

    render json: { status: 403, message: "Forbidden" }, status: :forbidden
  end

  def require_admin!
    authorize_role!(:admin)
  end
end
