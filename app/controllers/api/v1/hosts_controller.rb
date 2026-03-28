# frozen_string_literal: true

class Api::V1::HostsController < ApplicationController
  include HostScoped

  before_action :authenticate_user!
  before_action :authorize_role!
  before_action :set_host, only: [ :show ]
  before_action -> { authorize_host_access!(@host) }, only: [ :show ]

  def index
    render json: {
      status: { code: 200, message: "Hosts retrieved successfully." },
      data: HostBlueprint.render_as_hash(User.host)
    }, status: :ok
  end

  def show
    render json: {
      status: { code: 200, message: "Host retrieved successfully." },
      data: HostBlueprint.render_as_hash(@host)
    }, status: :ok
  end

  private

  def set_host
    @host = User.host.find_by(id: params[:id])
    render json: { status: 404, message: "Host not found" }, status: :not_found unless @host
  end

  def authorize_role!
    super(:admin, :emcee, :host)
  end
end
