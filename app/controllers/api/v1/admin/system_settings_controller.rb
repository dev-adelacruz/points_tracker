# frozen_string_literal: true

class Api::V1::Admin::SystemSettingsController < ApplicationController
  ALLOWED_KEYS = %w[company_coin_target].freeze

  before_action :authenticate_user!
  before_action :require_admin!

  def update
    key = params[:key]

    unless ALLOWED_KEYS.include?(key)
      render json: { status: { code: 422, message: "Unknown setting key." } }, status: :unprocessable_entity and return
    end

    value = params[:value].to_s
    if value.blank?
      render json: { status: { code: 422, message: "Value cannot be blank." } }, status: :unprocessable_entity and return
    end

    setting = SystemSetting.set(key, value)

    render json: {
      status: { code: 200, message: "Setting updated successfully." },
      data: { key: setting.key, value: setting.value }
    }, status: :ok
  end
end
