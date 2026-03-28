# frozen_string_literal: true

class Api::V1::Users::RolesController < ApplicationController
  before_action :authenticate_user!
  before_action :require_admin!
  before_action :set_target_user

  def update
    if @target_user.update(role: params[:role])
      render json: {
        status: { code: 200, message: "Role updated successfully." },
        data: UserBlueprint.render_as_hash(@target_user)
      }, status: :ok
    else
      render json: {
        message: "Role couldn't be updated. #{@target_user.errors.full_messages.to_sentence}"
      }, status: :unprocessable_entity
    end
  end

  private

  def set_target_user
    @target_user = User.find(params[:user_id])
  rescue ActiveRecord::RecordNotFound
    render json: { status: 404, message: "User not found." }, status: :not_found
  end
end
