# frozen_string_literal: true

require "swagger_helper"

RSpec.describe "Host::QuotaStats" do
  let(:json_response) { JSON.parse(response.body, symbolize_names: true) }
  let(:host) { create(:user, :host) }
  let(:emcee) { create(:user, :emcee) }
  let(:team) { create(:team) }
  let(:session) { create(:session, team: team, created_by: emcee, date: Date.current) }

  before do
    create(:team_membership, user: host, team: team)
  end

  describe "#show" do
    path "/api/v1/host/quota_stats" do
      get "returns the current host's monthly quota stats" do
        tags "Host::QuotaStats"
        produces "application/json"

        response(200, "returns quota stats for the authenticated host") do
          before do
            create(:coin_entry, session: session, user: host, coins: 60_000)
            sign_in host
          end

          run_test! do
            expect(response).to have_http_status :ok
            data = json_response[:data]
            expect(data[:total_coins]).to eq(60_000)
            expect(data[:monthly_coin_quota]).to eq(300_000)
            expect(data[:quota_progress]).to eq(20.0)
            expect(data).to have_key(:paced_monthly_coins)
            expect(data).to have_key(:on_track)
            expect(data).to have_key(:pacing_delta)
          end
        end

        response(200, "returns zero stats when host has no coin entries this month") do
          before { sign_in host }

          run_test! do
            expect(response).to have_http_status :ok
            data = json_response[:data]
            expect(data[:total_coins]).to eq(0)
            expect(data[:quota_progress]).to eq(0.0)
          end
        end

        response(403, "returns forbidden for emcee role") do
          before { sign_in emcee }

          run_test! do
            expect(response).to have_http_status :forbidden
          end
        end

        response(401, "returns unauthorized without token") do
          run_test! do
            expect(response).to have_http_status :unauthorized
          end
        end
      end
    end
  end
end
