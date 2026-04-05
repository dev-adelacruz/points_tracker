# frozen_string_literal: true

class Api::V1::Admin::SystemSettingsController < ApplicationController
  before_action :authenticate_user!
  before_action :require_admin!

  ALLOWED_KEYS = %w[at_risk_threshold_pct].freeze

  def show
    key = params[:key]
    unless key.in?(ALLOWED_KEYS)
      return render json: { status: { code: 404, message: "Setting not found." } }, status: :not_found
    end

    value = SystemSetting.get(key, default: default_for(key))
    render json: {
      status: { code: 200, message: "Setting retrieved successfully." },
      data:   { key: key, value: value }
    }, status: :ok
  end

  def update
    key = params[:key]
    unless key.in?(ALLOWED_KEYS)
      return render json: { status: { code: 404, message: "Setting not found." } }, status: :not_found
    end

    value = params.require(:value)

    if key == "at_risk_threshold_pct"
      numeric = value.to_f
      unless numeric >= 0 && numeric <= 100
        return render json: { status: { code: 422, message: "at_risk_threshold_pct must be between 0 and 100." } }, status: :unprocessable_entity
      end
    end

    SystemSetting.set(key, value)
    render json: {
      status: { code: 200, message: "Setting updated successfully." },
      data:   { key: key, value: value.to_s }
    }, status: :ok
  end

  private

  def default_for(key)
    { "at_risk_threshold_pct" => "20" }[key]
  end
end
