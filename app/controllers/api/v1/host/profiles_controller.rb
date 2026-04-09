# frozen_string_literal: true

class Api::V1::Host::ProfilesController < ApplicationController
  before_action :authenticate_user!
  before_action :authorize_host!

  def show
    render json: {
      status: { code: 200, message: "Profile retrieved successfully." },
      data:   { name: current_user.name, email: current_user.email }
    }, status: :ok
  end

  def update
    name             = params[:name].presence
    email            = params[:email].presence
    password         = params[:password].presence
    current_password = params[:current_password].to_s

    email_changing    = email.present? && email != current_user.email
    password_changing = password.present?

    if (email_changing || password_changing) && !current_user.valid_password?(current_password)
      return render json: {
        status: { code: 422, message: "Current password is incorrect." }
      }, status: :unprocessable_entity
    end

    attrs = {}
    attrs[:name]  = name  if name
    attrs[:email] = email if email_changing

    if password_changing
      attrs[:password]              = password
      attrs[:password_confirmation] = password
    end

    if current_user.update(attrs)
      render json: {
        status: { code: 200, message: "Profile updated successfully." },
        data:   { name: current_user.name, email: current_user.email }
      }, status: :ok
    else
      render json: {
        status: { code: 422, message: current_user.errors.full_messages.to_sentence }
      }, status: :unprocessable_entity
    end
  end

  private

  def authorize_host!
    authorize_role!(:host)
  end
end
