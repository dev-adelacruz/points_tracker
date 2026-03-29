# frozen_string_literal: true

class Api::V1::EmceesController < ApplicationController
  before_action :authenticate_user!
  before_action :require_admin!

  def index
    emcees = User.emcee

    render json: {
      status: { code: 200, message: "Emcees retrieved successfully." },
      data: emcees.map { |e| emcee_data(e) }
    }, status: :ok
  end

  private

  def require_admin!
    return if current_user.admin?

    render json: { status: 403, message: "Forbidden" }, status: :forbidden
  end

  def emcee_data(emcee)
    {
      id: emcee.id,
      name: emcee.name,
      email: emcee.email,
      teams: emcee.teams.map { |t| { id: t.id, name: t.name } }
    }
  end
end
