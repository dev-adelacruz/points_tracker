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

  def create
    emcee = current_company.users.build(emcee_params.merge(role: :emcee))

    if emcee.save
      render json: {
        status: { code: 201, message: "Emcee created successfully." },
        data: emcee_data(emcee)
      }, status: :created
    else
      render json: {
        status: { code: 422, message: emcee.errors.full_messages.join(", ") }
      }, status: :unprocessable_entity
    end
  end

  private

  def require_admin!
    return if current_user.admin?

    render json: { status: 403, message: "Forbidden" }, status: :forbidden
  end

  def emcee_params
    params.require(:emcee).permit(:name, :email, :password)
  end

  def emcee_data(emcee)
    {
      id: emcee.id,
      name: emcee.name,
      email: emcee.email,
      teams: emcee.assigned_teams.map { |t| { id: t.id, name: t.name } }
    }
  end
end
