# frozen_string_literal: true

class Api::V1::TeamsController < ApplicationController
  include TeamScoped

  before_action :authenticate_user!
  before_action :authorize_role!

  def index
    render json: {
      status: { code: 200, message: "Teams retrieved successfully." },
      data: TeamBlueprint.render_as_hash(current_teams)
    }, status: :ok
  end

  private

  def authorize_role!
    super(:admin, :emcee)
  end
end
